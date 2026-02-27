import React, { useCallback, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow, { type ChatMessage } from './components/ChatWindow'
import MessageInput from './components/MessageInput'
import { generateAzureAnswer, isAzureConfigured } from './services/azureService'

const FALLBACK_MESSAGE = 'I don’t have information in the knowledge base.'

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setMessages((prev) => [...prev, userMessage])
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
        setMessages((prev) => [...prev, botMessage])
      } catch (err) {
        console.error(err)
        setError('Unable to reach Azure OpenAI. Showing fallback response.')
        const botMessage: ChatMessage = {
          role: 'bot',
          content: FALLBACK_MESSAGE,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, botMessage])
      } finally {
        setIsThinking(false)
      }
    },
    [isThinking],
  )

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-area">
        <ChatWindow messages={messages} isThinking={isThinking} />
        {error && <div className="error-banner">{error}</div>}
        <div className="bottom-bar">
          <MessageInput onSend={handleSendMessage} disabled={isThinking} />
        </div>
      </div>
    </div>
  )
}

export default App
