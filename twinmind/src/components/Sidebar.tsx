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
      <div className="teams-sidebar-header">
        <h1 className="teams-sidebar-title">Chat</h1>
        <div className="teams-sidebar-actions">
          <button className="icon-btn-small">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </button>
          <button className="icon-btn-small">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
          <button className="icon-btn-small">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>
      </div>

      <div className="teams-sidebar-filters">
        <span className="filter-pill filter-unread">Unread</span>
        <span className="filter-pill">Chats</span>
        <span className="filter-pill">Unmuted</span>
        <span className="filter-pill">Meeting chats</span>
      </div>

      <div className="teams-sidebar-pinned">
        <div className="pinned-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><polygon points="9 9 15 12 9 15 9 9"></polygon></svg>
          <span>Copilot</span>
        </div>
        <div className="pinned-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
          <span>Mentions</span>
        </div>
        <div className="pinned-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          <span>Drafts</span>
        </div>
      </div>

      <div className="teams-sidebar-section">
        <div className="section-header">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
          <span>Favorites</span>
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
                <div className="chat-avatar-container">
                  <div className="chat-avatar">{chat.avatarInitials}</div>
                  <div className={`status-indicator ${chat.isBot ? 'status-bot' : 'status-online'}`}></div>
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
      </div>
    </aside>
  )
}

export default Sidebar

