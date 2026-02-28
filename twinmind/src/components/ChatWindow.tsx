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
  avatarInitials: string
  isBot: boolean
  onStartCall?: () => void
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
  avatarInitials,
  isBot,
  onStartCall,
}) => {
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, isThinking])

  return (
    <div className="chat-window">
      <div className="chat-header-teams">
        <div className="chat-header-left">
          <div className="chat-header-avatar">{avatarInitials}</div>
          <div className="chat-header-info">
            <h2 className="chat-title">{title}</h2>
            {subtitle && <p className="chat-subtitle">{subtitle}</p>}
          </div>
          <div className="chat-tabs">
            <div className="chat-tab active">Chat</div>
            <div className="chat-tab">Shared</div>
            <div className="chat-tab">Storyline</div>
            <div className="chat-tab-add">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
          </div>
        </div>
        <div className="chat-header-right">
          {!isBot && (
            <>
              <button className="icon-btn" title="Video Call" onClick={onStartCall}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              </button>
              <button className="icon-btn" title="Audio Call" onClick={onStartCall}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </button>
            </>
          )}
          <button className="icon-btn" title="Add People">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          </button>
          <button className="icon-btn" title="More Options">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </button>
        </div>
      </div>
      <div className="message-list" ref={listRef}>
        {messages.map((message, index) => {
          const isUser = message.role === 'user'
          return (
            <div
              key={`${message.role}-${index}-${message.timestamp || index}`}
              className={`message-row ${isUser ? 'align-right' : 'align-left'}`}
            >
              {!isUser && (
                <div className="message-avatar-wrap">
                  <div className="chat-avatar">{avatarInitials}</div>
                </div>
              )}
              <div className="message-body">
                {!isUser && (
                  <div className="message-header-info">
                    <span className="message-sender-name">{title}</span>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                )}
                {isUser && (
                  <div className="message-header-info right">
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                )}
                <div
                  className={`message-bubble ${isUser ? 'message-user' : 'message-bot'
                    }`}
                >
                  <div className="message-content">{message.content}</div>
                </div>
              </div>
            </div>
          )
        })}
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

