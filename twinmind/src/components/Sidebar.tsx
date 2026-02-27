import React from 'react'

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">TwinMind</h1>
        <p className="app-subtitle">TwinMind AI</p>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-hint">
          Ask questions and TwinMind will answer strictly from documents indexed
          via Azure OpenAI On Your Data.
        </p>
      </div>
    </aside>
  )
}

export default Sidebar


