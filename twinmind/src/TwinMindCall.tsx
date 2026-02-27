import { useState } from 'react'
import CallRecorder from './CallRecorder'

export function TwinMindCall() {
  const [inCall, setInCall] = useState(false)

  const handleStartCall = () => {
    setInCall(true)
  }

  const handleEndCall = () => {
    setInCall(false)
  }

  return (
    <div className="twinmind-call">
      <header className="twinmind-call-header">
        <h1 className="twinmind-call-title">TwinMind Teams Clone</h1>
        <p className="twinmind-call-subtitle">
          TwinMind AI bot is present in this call. Transcript will be recorded automatically.
        </p>
      </header>

      <section className="twinmind-call-body">
        <div className="twinmind-call-participants">
          <div className="twinmind-avatar twinmind-avatar--user">You</div>
          <div className="twinmind-avatar twinmind-avatar--bot">TwinMind AI</div>
        </div>

        <div className="twinmind-call-status">
          Call status:{' '}
          <span className={`twinmind-call-status-badge twinmind-call-status-badge--${inCall ? 'on' : 'off'}`}>
            {inCall ? 'In Call' : 'Idle'}
          </span>
        </div>

        <div className="twinmind-call-controls">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartCall}
            disabled={inCall}
          >
            Start Call with TwinMind
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleEndCall}
            disabled={!inCall}
          >
            End Call
          </button>
        </div>
      </section>

      <section className="twinmind-call-recorder">
        <CallRecorder autoStart={inCall} />
      </section>
    </div>
  )
}

export default TwinMindCall

