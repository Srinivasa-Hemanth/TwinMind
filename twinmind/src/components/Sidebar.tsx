import React from 'react'

export interface ChatSummary {
  id: string
  title: string
  lastMessagePreview: string
  timeLabel: string
  isBot: boolean
  avatarInitials: string
}

interface SidebarProps {
  chats: ChatSummary[]
  selectedChatId: string
  onSelectChat: (id: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-header">
          <div className="app-badge">AI</div>
          <div>
            <h1 className="app-title">TwinMind AI</h1>
            <p className="app-subtitle">Chat</p>
          </div>
        </div>
        <div className="sidebar-status">
          <span className="status-pill status-pill-active">Active</span>
          <div className="user-pill">
            <span className="user-avatar">TP</span>
            <span className="user-name">You</span>
          </div>
        </div>
      </div>

      <div className="chat-list-header">
        <span className="chat-list-title">Chats</span>
      </div>

      <ul className="chat-list">
        {chats.map((chat) => {
          const isSelected = chat.id === selectedChatId
          return (
            <li
              key={chat.id}
              className={`chat-list-item ${isSelected ? 'chat-selected' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="chat-avatar">
                <span>{chat.avatarInitials}</span>
              </div>
              <div className="chat-list-main">
                <div className="chat-list-row">
                  <span className="chat-list-name">{chat.title}</span>
                  <span className="chat-list-time">{chat.timeLabel}</span>
                </div>
                <div className="chat-list-preview">
                  {chat.lastMessagePreview || (chat.isBot ? 'TwinMind AI' : '')}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export default Sidebar

