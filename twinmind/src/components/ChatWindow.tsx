import React, { useEffect, useRef } from 'react'

export interface ChatMessage {
  role: 'user' | 'bot'
  content: string
  timestamp?: string
}

interface ChatWindowProps {
  messages: ChatMessage[]
  isThinking: boolean
}

function formatTime(dateString?: string): string {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isThinking }) => {
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, isThinking])

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <h2 className="chat-title">TwinMind</h2>
          <p className="chat-subtitle">
            Questions are answered only from your indexed documents.
          </p>
        </div>
      </div>
      <div className="message-list" ref={listRef}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}-${message.timestamp || index}`}
            className={`message-row ${
              message.role === 'user' ? 'align-right' : 'align-left'
            }`}
          >
            <div
              className={`message-bubble ${
                message.role === 'user' ? 'message-user' : 'message-bot'
              }`}
            >
              <div className="message-content">{message.content}</div>
              {message.timestamp && (
                <div className="message-meta">
                  <span className="message-role">
                    {message.role === 'user' ? 'You' : 'TwinMind'}
                  </span>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="message-row align-left">
            <div className="message-bubble message-bot thinking-bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        {messages.length === 0 && !isThinking && (
          <div className="empty-state">
            <p>
              Start by asking a question. TwinMind will use Azure OpenAI with On
              Your Data to answer from your connected knowledge base.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatWindow

