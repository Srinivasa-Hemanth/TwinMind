import React, { useCallback, useMemo, useState } from 'react'
import Sidebar, { type ChatSummary } from './components/Sidebar'
import ChatWindow, { type ChatMessage } from './components/ChatWindow'
import MessageInput from './components/MessageInput'
import { generateAzureAnswer, isAzureConfigured } from './services/azureService'
import CallRecorder from './CallRecorder'

const FALLBACK_MESSAGE = 'I don’t have information in the knowledge base.'

type ChatId = 'twinmind' | 'pravallika' | 'sai' | 'team'

const initialChats: ChatSummary[] = [
  {
    id: 'twinmind',
    title: 'TwinMind',
    lastMessagePreview: 'Ask me about your work.',
    timeLabel: 'Now',
    isBot: true,
    avatarInitials: 'AI',
  },
  {
    id: 'pravallika',
    title: 'Pravallika Kollipara',
    lastMessagePreview: 'Sent an image',
    timeLabel: '9:26 PM',
    isBot: false,
    avatarInitials: 'PK',
  },
  {
    id: 'sai',
    title: 'Sai Chandana',
    lastMessagePreview: 'yes Uday',
    timeLabel: '7:09 PM',
    isBot: false,
    avatarInitials: 'SC',
  },
  {
    id: 'team',
    title: 'TwinMind Team',
    lastMessagePreview: 'Daily NOP updates – quick sync.',
    timeLabel: '4:03 PM',
    isBot: false,
    avatarInitials: 'TT',
  },
]

const App: React.FC = () => {
  const [chats, setChats] = useState<ChatSummary[]>(initialChats)
  const [selectedChatId, setSelectedChatId] = useState<ChatId>('twinmind')
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({
    twinmind: [],
    pravallika: [],
    sai: [],
    team: [],
  })
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? chats[0],
    [chats, selectedChatId],
  )

  const currentMessages = messagesByChat[selectedChat.id] ?? []

  const handleSelectChat = useCallback((id: string) => {
    setIsCallActive(false)
    setSelectedChatId(id as ChatId)
    setError(null)
  }, [])

  const handleSendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isThinking) return

      const timestamp = new Date().toISOString()
      const userMessage: ChatMessage = {
        role: 'user',
        content: trimmed,
        timestamp,
      }

      setMessagesByChat((prev) => {
        const existing = prev[selectedChat.id] ?? []
        return {
          ...prev,
          [selectedChat.id]: [...existing, userMessage],
        }
      })

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                lastMessagePreview: trimmed,
                timeLabel: new Date().toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              }
            : chat,
        ),
      )

      if (!selectedChat.isBot) {
        // Simple local echo for non-bot chats
        const reply: ChatMessage = {
          role: 'bot',
          content: 'This is a sample chat thread for UI purposes.',
          timestamp: new Date().toISOString(),
        }
        setMessagesByChat((prev) => {
          const existing = prev[selectedChat.id] ?? []
          return {
            ...prev,
            [selectedChat.id]: [...existing, reply],
          }
        })
        return
      }

      setError(null)
      setIsThinking(true)

      try {
        if (!isAzureConfigured()) {
          throw new Error('Azure configuration is missing.')
        }

        const answer = await generateAzureAnswer(trimmed)
        const content =
          answer && answer.trim().length > 0 ? answer : FALLBACK_MESSAGE

        const botMessage: ChatMessage = {
          role: 'bot',
          content,
          timestamp: new Date().toISOString(),
        }
        setMessagesByChat((prev) => {
          const existing = prev[selectedChat.id] ?? []
          return {
            ...prev,
            [selectedChat.id]: [...existing, botMessage],
          }
        })
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessagePreview: content.slice(0, 80),
                  timeLabel: new Date().toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  }),
                }
              : chat,
          ),
        )
      } catch (err) {
        console.error(err)
        setError('Unable to reach Azure OpenAI. Showing fallback response.')
        const botMessage: ChatMessage = {
          role: 'bot',
          content: FALLBACK_MESSAGE,
          timestamp: new Date().toISOString(),
        }
        setMessagesByChat((prev) => {
          const existing = prev[selectedChat.id] ?? []
          return {
            ...prev,
            [selectedChat.id]: [...existing, botMessage],
          }
        })
      } finally {
        setIsThinking(false)
      }
    },
    [isThinking, selectedChat],
  )

  const chatSubtitle = selectedChat.isBot
    ? 'Questions are answered only from your indexed documents.'
    : 'Personal chat'

  const shouldShowRecorder = selectedChat.isBot || isCallActive

  const handleStartCall = useCallback(() => {
    if (!selectedChat.isBot) return
    setIsCallActive(true)
  }, [selectedChat.isBot])

  const handleEndCall = useCallback(() => {
    setIsCallActive(false)
  }, [])

  return (
    <div className="app-container">
      <Sidebar
        chats={chats}
        selectedChatId={selectedChat.id}
        onSelectChat={handleSelectChat}
      />
      <div className="main-area">
        <ChatWindow
          messages={currentMessages}
          isThinking={isThinking && selectedChat.isBot}
          title={selectedChat.title}
          subtitle={chatSubtitle}
          canStartCall={selectedChat.isBot}
          isCallActive={selectedChat.isBot ? isCallActive : false}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
        />
        {error && <div className="error-banner">{error}</div>}
        <div className="bottom-bar">
          <div
            className={`call-recorder-shell ${shouldShowRecorder ? '' : 'call-recorder-shell--hidden'}`}
            aria-hidden={!shouldShowRecorder}
          >
            <CallRecorder
              active={selectedChat.isBot ? isCallActive : false}
              showControls={false}
            />
          </div>
          <MessageInput onSend={handleSendMessage} disabled={isThinking} />
        </div>
      </div>
    </div>
  )
}

export default App
