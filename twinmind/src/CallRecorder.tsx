import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type CallRecorderStatus = 'Idle' | 'Recording' | 'Unsupported' | 'Error'

type CallRecorderProps = {
  /**
   * When true, the recorder will start and keep recording. When false, it stops and downloads the transcript.
   * If omitted, falls back to `autoStart` for backward compatibility.
   */
  active?: boolean
  /**
   * Backward-compatible alias for `active`.
   */
  autoStart?: boolean
  /**
   * If false, hides the Start/End buttons (useful when controlled by a call icon).
   */
  showControls?: boolean
  onRecordingStart?: () => void
  onRecordingEnd?: () => void
}

type SpeechRecognitionAlternativeLike = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: SpeechRecognitionAlternativeLike
}

type SpeechRecognitionResultListLike = {
  length: number
  [index: number]: SpeechRecognitionResultLike
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}

type SpeechRecognitionErrorEventLike = {
  error?: string
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onstart: ((this: SpeechRecognitionLike, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((this: SpeechRecognitionLike, ev: SpeechRecognitionErrorEventLike) => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

const getSpeechRecognitionConstructor = (): SpeechRecognitionCtor | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
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

export function CallRecorder({
  active,
  autoStart,
  showControls = true,
  onRecordingStart,
  onRecordingEnd,
}: CallRecorderProps) {
  const recognitionCtor = useMemo(() => getSpeechRecognitionConstructor(), [])
  const supported = Boolean(recognitionCtor)

  const [internalActive, setInternalActive] = useState(false)
  const desiredActive = active ?? autoStart ?? internalActive

  const [status, setStatus] = useState<CallRecorderStatus>(() =>
    supported ? 'Idle' : 'Unsupported',
  )
  const [isRecording, setIsRecording] = useState(false)
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(() =>
    supported
      ? null
      : 'Speech recognition is not supported in this browser. Please use the latest version of Google Chrome.',
  )
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const desiredActiveRef = useRef(false)
  const isManuallyStoppingRef = useRef(false)
  const shouldDownloadOnStopRef = useRef(false)
  const pendingStartTimeRef = useRef<Date | null>(null)
  const pendingEndTimeRef = useRef<Date | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const finalTranscriptRef = useRef('')

  const finalizeAndDownloadTranscript = useCallback((startedAt: Date, endedAt: Date) => {
    const started = formatTimestamp(startedAt)
    const ended = formatTimestamp(endedAt)
    const transcriptText = finalTranscriptRef.current.trim()

    const content = `Call Started: ${started}
Call Ended: ${ended}

Transcript:
${transcriptText || '(no speech captured)'}
`

    const filename = `transcript_${formatFilenameTimestamp(endedAt)}.txt`
    triggerDownload(filename, content)

    setFinalTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
    startTimeRef.current = null
    setStartTime(null)
    setEndTime(null)
  }, [])

  useEffect(() => {
    desiredActiveRef.current = desiredActive
  }, [desiredActive])

  useEffect(() => {
    if (!recognitionCtor) return

    const recognition = new recognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setError(null)
      setStatus('Recording')
      setIsRecording(true)

      const startedAt = pendingStartTimeRef.current ?? new Date()
      pendingStartTimeRef.current = null
      startTimeRef.current = startedAt
      setStartTime(startedAt)
      setEndTime(null)

      finalTranscriptRef.current = ''
      setFinalTranscript('')
      setInterimTranscript('')

      if (onRecordingStart) {
        onRecordingStart()
      }
    }

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = ''
      let appendedFinal = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) {
          appendedFinal += text
        } else {
          interim += text
        }
      }

      if (appendedFinal) {
        const nextFinal = `${finalTranscriptRef.current}${appendedFinal} `
        finalTranscriptRef.current = nextFinal
        setFinalTranscript(nextFinal.trim())
      }

      setInterimTranscript(interim.trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const code = event.error ?? ''
      const message =
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone permission is blocked. Please allow mic access and try again.'
          : 'An error occurred during speech recognition.'

      setStatus('Error')
      setError(message)
      setIsRecording(false)
    }

    recognition.onend = () => {
      if (isManuallyStoppingRef.current) {
        isManuallyStoppingRef.current = false
        const finishedAt = pendingEndTimeRef.current ?? new Date()
        pendingEndTimeRef.current = null

        setIsRecording(false)
        setStatus('Idle')
        setEndTime(finishedAt)

        const startedAt = startTimeRef.current
        if (shouldDownloadOnStopRef.current && startedAt) {
          shouldDownloadOnStopRef.current = false
          finalizeAndDownloadTranscript(startedAt, finishedAt)
        } else {
          shouldDownloadOnStopRef.current = false
        }

        if (onRecordingEnd) {
          onRecordingEnd()
        }

        return
      }

      if (desiredActiveRef.current) {
        try {
          recognition.start()
        } catch {
          setStatus('Error')
          setError('Unable to restart speech recognition automatically.')
          setIsRecording(false)
        }
      } else {
        setIsRecording(false)
        setStatus('Idle')
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [finalizeAndDownloadTranscript, onRecordingEnd, onRecordingStart, recognitionCtor])

  useEffect(() => {
    if (!supported) return
    const recognition = recognitionRef.current
    if (!recognition) return

    if (desiredActive) {
      pendingStartTimeRef.current = new Date()
      try {
        recognition.start()
      } catch {
        // ignore (e.g. already started)
      }
      return
    }

    if (isRecording) {
      isManuallyStoppingRef.current = true
      shouldDownloadOnStopRef.current = true
      pendingEndTimeRef.current = new Date()
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    }
  }, [desiredActive, isRecording, supported])

  const isStartDisabled = isRecording || status === 'Unsupported'
  const isEndDisabled = !isRecording
  const liveTranscript = `${finalTranscript}${finalTranscript && interimTranscript ? ' ' : ''}${interimTranscript}`

  return (
    <div className="call-recorder">
      <div className="call-recorder-header">
        <h2 className="call-recorder-title">Call Recorder</h2>
        <span className={`call-recorder-status call-recorder-status--${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      <div className="call-recorder-transcript">
        {liveTranscript ? (
          <p>{liveTranscript}</p>
        ) : (
          <p className="call-recorder-transcript-placeholder">
            {status === 'Unsupported'
              ? 'Speech recognition is not available in this browser.'
              : 'Live transcript will appear here during the call.'}
          </p>
        )}
      </div>

      {error && <div className="call-recorder-error">{error}</div>}

      {showControls && (
        <div className="call-recorder-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setInternalActive(true)}
            disabled={isStartDisabled}
          >
            Start Call
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setInternalActive(false)}
            disabled={isEndDisabled}
          >
            End Call
          </button>
        </div>
      )}

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

