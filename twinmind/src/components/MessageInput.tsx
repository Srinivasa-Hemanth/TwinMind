import React, { useCallback, useState } from 'react'

interface MessageInputProps {
  onSend: (text: string) => void
  disabled: boolean
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [value, setValue] = useState('')

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
    event,
  ) => {
    setValue(event.target.value)
  }

  const send = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }, [value, disabled, onSend])

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="message-input-container">
      <textarea
        className="message-input"
        placeholder="Ask a question for TwinMind to answer from your knowledge base..."
        rows={2}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        type="button"
        className="send-button"
        onClick={send}
        disabled={disabled || !value.trim()}
      >
        Send
      </button>
    </div>
  )
}

export default MessageInput

