import React, { useEffect, useState } from 'react'

export interface CallModalProps {
    isOpen: boolean
    contactName: string
    avatarInitials: string
    onEndCall: (transcript: string) => void
    liveTranscript?: string
}

const CallModal: React.FC<CallModalProps> = ({ isOpen, contactName, avatarInitials, onEndCall, liveTranscript = '' }) => {
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        let interval: number | undefined
        if (isOpen) {
            interval = window.setInterval(() => {
                setSeconds((s) => s + 1)
            }, 1000)
        }
        return () => {
            if (interval !== undefined) {
                clearInterval(interval)
            }
        }
    }, [isOpen])

    if (!isOpen) return null

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60)
        const s = totalSeconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const handleEndCall = () => {
        // Generate MOM based on the real transcript
        const mom = `**MOM (Minutes of Meeting) with ${contactName}:**\n\n${liveTranscript ? `Transcript snapshot:\n"${liveTranscript}"\n\n` : ''}`
        onEndCall(mom)
    }

    return (
        <div className="call-modal-overlay">
            <div className="call-modal-container">

                {/* Call Info Header */}
                <div className="call-header">
                    <span className="call-title">Meeting with {contactName}</span>
                    <span className="call-timer">{formatTime(seconds)}</span>
                </div>

                {/* Video Grid */}
                <div className="call-grid">
                    <div className="call-participant user-participant">
                        <div className="call-avatar-large">DR</div>
                        <span className="call-name-badge">You</span>
                    </div>

                    <div className="call-participant bot-participant">
                        <div className="call-avatar-large bot-avatar">AI</div>
                        <span className="call-name-badge">TwinMind AI</span>
                    </div>

                    <div className="call-participant contact-participant">
                        <div className="call-avatar-large contact-avatar">{avatarInitials}</div>
                        <span className="call-name-badge">{contactName}</span>
                    </div>
                </div>

                {/* Live Transcript Panel */}
                <div className="call-transcript-panel">
                    <div className="transcript-title">Live Transcript</div>
                    <div className="transcript-scroll">
                        {liveTranscript ? (
                            <div className="transcript-line visible">{liveTranscript}</div>
                        ) : (
                            <div className="transcript-typing">Waiting for speech...</div>
                        )}
                    </div>
                </div>

                {/* Call Controls */}
                <div className="call-controls">
                    <button className="call-btn control-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path><rect x="3" y="6" width="12" height="12" rx="2" ry="2"></rect></svg>
                    </button>
                    <button className="call-btn control-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"></path><path d="M19 10v2a7 7 0 01-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    </button>
                    <button className="call-btn control-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    </button>

                    <button className="call-btn end-call-btn" onClick={handleEndCall}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>
                        Leave
                    </button>
                </div>

            </div>
        </div>
    )
}

export default CallModal
