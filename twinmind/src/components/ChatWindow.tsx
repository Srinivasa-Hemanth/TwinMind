import React, { useEffect, useRef } from 'react'

export interface ChatMessage {
  role: 'user' | 'bot'
  content: string
  timestamp?: string
}

interface ChatWindowProps {
  messages: ChatMessage[]
  isThinking: boolean
  title: string
  subtitle?: string
  canStartCall?: boolean
  isCallActive?: boolean
  onStartCall?: () => void
  onEndCall?: () => void
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

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isThinking,
  title,
  subtitle,
  canStartCall,
  isCallActive,
  onStartCall,
  onEndCall,
}) => {
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
          <h2 className="chat-title">{title}</h2>
          {subtitle && <p className="chat-subtitle">{subtitle}</p>}
        </div>
        {canStartCall && (
          <div className="chat-actions">
            {!isCallActive ? (
              <button
                type="button"
                className="icon-button"
                title="Start call"
                aria-label="Start call"
                onClick={onStartCall}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.3 3.9c.3-.7 1.1-1 1.8-.8l2.6.9c.7.2 1.1 1 .9 1.7l-.9 2.7c-.2.5-.6.9-1.2.9H8.7c1 2 2.6 3.7 4.6 4.7v-1.8c0-.6.4-1 .9-1.2l2.7-.9c.7-.2 1.5.2 1.7.9l.9 2.6c.2.7-.1 1.5-.8 1.8l-1.6.7c-.5.2-1 .3-1.6.3-6.1 0-11-4.9-11-11 0-.5.1-1.1.3-1.6l.7-1.6Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="icon-button icon-button-danger"
                title="End call"
                aria-label="End call"
                onClick={onEndCall}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.6 12.4c.7-.7 1.6-1.3 2.6-1.7 1.5-.6 3.2-1 4.8-1 1.6 0 3.3.4 4.8 1 1 .4 1.9 1 2.6 1.7.4.4.6 1 .4 1.6l-.6 1.8c-.2.7-1 1.1-1.7.9l-2.7-.9c-.5-.2-.9-.6-.9-1.2v-1.1c-1.2-.3-2.5-.3-3.7 0v1.1c0 .6-.4 1-.9 1.2l-2.7.9c-.7.2-1.5-.2-1.7-.9l-.6-1.8c-.2-.6 0-1.2.4-1.6Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
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

