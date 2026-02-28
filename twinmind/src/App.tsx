import React, { useCallback, useMemo, useState } from 'react'
import NavRail from './components/NavRail'
import Sidebar, { type ChatSummary } from './components/Sidebar'
import ChatWindow, { type ChatMessage } from './components/ChatWindow'
import MessageInput from './components/MessageInput'
import { generateAzureAnswer, isAzureConfigured } from './services/azureService'

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
  {
    id: 'john',
    title: 'John Doe',
    lastMessagePreview: 'Can you send the report?',
    timeLabel: 'Yesterday',
    isBot: false,
    avatarInitials: 'JD',
  },
  {
    id: 'jane',
    title: 'Jane Smith',
    lastMessagePreview: 'Thanks!',
    timeLabel: 'Yesterday',
    isBot: false,
    avatarInitials: 'JS',
  },
  {
    id: 'alex',
    title: 'Alex Johnson',
    lastMessagePreview: 'Meeting at 3 PM.',
    timeLabel: 'Monday',
    isBot: false,
    avatarInitials: 'AJ',
  },
]

const App: React.FC = () => {
  const [chats, setChats] = useState<ChatSummary[]>(initialChats)
  const [selectedChatId, setSelectedChatId] = useState<ChatId>('twinmind')
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({
    twinmind: [],
    pravallika: [
      {
        role: 'bot',
        content: 'Hey Srinivasa, check out this query:\n\n```sql\nSELECT * INTO COI_Backup_10282025 FROM COI\n```\n\nRun this first.',
        timestamp: new Date().toISOString(),
      },
    ],
    sai: [
      {
        role: 'bot',
        content: 'yes Uday',
        timestamp: new Date(Date.now() - 10000000).toISOString(),
      },
    ],
    team: [
      {
        role: 'bot',
        content: 'Daily NOP updates – quick sync.',
        timestamp: new Date(Date.now() - 20000000).toISOString(),
      },
    ],
    john: [
      {
        role: 'bot',
        content: 'Can you send the report?',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    jane: [
      {
        role: 'bot',
        content: 'Thanks!',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    alex: [
      {
        role: 'bot',
        content: 'Meeting at 3 PM.',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
  })
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? chats[0],
    [chats, selectedChatId],
  )

  const currentMessages = messagesByChat[selectedChat.id] ?? []

  const handleSelectChat = useCallback((id: string) => {
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
        // AI does not respond to non-bot chats.
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

  return (
    <div className="app-container">
      <NavRail />
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
          avatarInitials={selectedChat.avatarInitials}
          isBot={selectedChat.isBot}
        />
        {error && <div className="error-banner">{error}</div>}
        <div className="bottom-bar">
          <MessageInput onSend={handleSendMessage} disabled={isThinking} />
        </div>
      </div>
    </div>
  )
}

export default App
