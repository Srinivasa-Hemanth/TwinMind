import { useEffect, useRef, useState } from 'react'

type CallRecorderStatus = 'Idle' | 'Recording' | 'Unsupported' | 'Error'

type CallRecorderProps = {
  autoStart?: boolean
  onRecordingStart?: () => void
  onRecordingEnd?: () => void
}

declare global {
  interface Window {
    // Use loose typing here because Web Speech API types are not yet in lib.dom
    // and vary slightly across browsers.
    webkitSpeechRecognition?: new () => any
    SpeechRecognition?: new () => any
  }
}

const getSpeechRecognitionConstructor = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return (window.SpeechRecognition || window.webkitSpeechRecognition || null) as
    | (new () => any)
    | null
}

const formatTimestamp = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formatFilenameTimestamp = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

const triggerDownload = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function CallRecorder({ autoStart, onRecordingStart, onRecordingEnd }: CallRecorderProps) {
  const [status, setStatus] = useState<CallRecorderStatus>('Idle')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  const recognitionRef = useRef<any>(null)
  const isManuallyStoppingRef = useRef(false)

  useEffect(() => {
    const RecognitionCtor = getSpeechRecognitionConstructor()

    if (!RecognitionCtor) {
      setStatus('Unsupported')
      setError(
        'Speech recognition is not supported in this browser. Please use the latest version of Google Chrome.',
      )
      return
    }

    const recognition = new RecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let fullTranscript = ''
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        fullTranscript += result[0].transcript
        if (result.isFinal) {
          fullTranscript += ' '
        }
      }
      setTranscript(fullTranscript.trim())
    }

    recognition.onerror = () => {
      setStatus('Error')
      setError('An error occurred during speech recognition.')
      setIsRecording(false)
    }

    recognition.onend = () => {
      if (isManuallyStoppingRef.current) {
        isManuallyStoppingRef.current = false
        return
      }

      if (isRecording) {
        try {
          recognition.start()
        } catch {
          setStatus('Error')
          setError('Unable to restart speech recognition automatically.')
          setIsRecording(false)
        }
      }
    }

    recognitionRef.current = recognition
    setStatus('Idle')

    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.stop()
    }
  }, [isRecording])

  useEffect(() => {
    if (autoStart && status === 'Idle' && !isRecording) {
      void handleStart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, status])

  const finalizeAndDownloadTranscript = (finalTranscript: string, startedAt: Date, endedAt: Date) => {
    const started = formatTimestamp(startedAt)
    const ended = formatTimestamp(endedAt)

    const content = `Call Started: ${started}
Call Ended: ${ended}

Transcript:
${finalTranscript || '(no speech captured)'}
`

    const filename = `transcript_${formatFilenameTimestamp(endedAt)}.txt`
    triggerDownload(filename, content)

    setTranscript('')
    setStartTime(null)
    setEndTime(null)
  }

  const handleStart = async () => {
    if (status === 'Unsupported' || isRecording) {
      return
    }

    const recognition = recognitionRef.current
    if (!recognition) {
      setStatus('Error')
      setError('Speech recognition is not ready.')
      return
    }

    try {
      setError(null)
      const now = new Date()
      setStartTime(now)
      setEndTime(null)
      setIsRecording(true)
      setStatus('Recording')
      recognition.start()
      if (onRecordingStart) {
        onRecordingStart()
      }
    } catch {
      setStatus('Error')
      setError('Failed to start speech recognition.')
      setIsRecording(false)
    }
  }

  const handleStop = () => {
    if (!isRecording) {
      return
    }

    const recognition = recognitionRef.current
    if (!recognition) {
      setIsRecording(false)
      setStatus('Idle')
      return
    }

    isManuallyStoppingRef.current = true
    try {
      recognition.stop()
    } catch {
      // ignore
    }

    const finishedAt = new Date()
    setIsRecording(false)
    setStatus('Idle')
    setEndTime(finishedAt)

    if (startTime) {
      finalizeAndDownloadTranscript(transcript, startTime, finishedAt)
    }

    if (onRecordingEnd) {
      onRecordingEnd()
    }
  }

  const isStartDisabled = isRecording || status === 'Unsupported'
  const isEndDisabled = !isRecording

  return (
    <div className="call-recorder">
      <div className="call-recorder-header">
        <h2 className="call-recorder-title">Call Recorder</h2>
        <span className={`call-recorder-status call-recorder-status--${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      <div className="call-recorder-transcript">
        {transcript ? (
          <p>{transcript}</p>
        ) : (
          <p className="call-recorder-transcript-placeholder">
            {status === 'Unsupported'
              ? 'Speech recognition is not available in this browser.'
              : 'Live transcript will appear here during the call.'}
          </p>
        )}
      </div>

      {error && <div className="call-recorder-error">{error}</div>}

      <div className="call-recorder-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleStart}
          disabled={isStartDisabled}
        >
          Start Call
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleStop}
          disabled={isEndDisabled}
        >
          End Call
        </button>
      </div>

      {startTime && !endTime && (
        <div className="call-recorder-meta">Call started at: {formatTimestamp(startTime)}</div>
      )}
      {startTime && endTime && (
        <div className="call-recorder-meta">
          Call lasted from {formatTimestamp(startTime)} to {formatTimestamp(endTime)}
        </div>
      )}
    </div>
  )
}

export default CallRecorder

