import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from './authConfig'


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
  contactName?: string
  onRecordingStart?: () => void
  onRecordingEnd?: () => void
  onTranscriptChange?: (text: string) => void
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



export function CallRecorder({
  active,
  autoStart,
  showControls = true,
  contactName,
  onRecordingStart,
  onRecordingEnd,
  onTranscriptChange,
}: CallRecorderProps) {
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() || accounts[0] || null

  const handleSignIn = useCallback(() => {
    try {
      setError(null)
      instance.loginRedirect(loginRequest)
    } catch (e: any) {
      console.error('MSAL redirect failed:', e)
      setError(`Redirect failed: ${e.message ?? e.toString()}`)
    }
  }, [instance])
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const desiredActiveRef = useRef(false)
  const isManuallyStoppingRef = useRef(false)
  const shouldDownloadOnStopRef = useRef(false)
  const pendingStartTimeRef = useRef<Date | null>(null)
  const pendingEndTimeRef = useRef<Date | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const finalTranscriptRef = useRef('')
  const onTranscriptChangeRef = useRef(onTranscriptChange)

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange
  }, [onTranscriptChange])

  const finalizeAndDownloadTranscript = useCallback(async (startedAt: Date, endedAt: Date) => {
    const started = formatTimestamp(startedAt)
    const ended = formatTimestamp(endedAt)
    const transcriptText = finalTranscriptRef.current.trim()

    const contactDisplay = contactName || 'Unknown Contact'
    const safeContactName = contactDisplay.replace(/[^a-z0-9]/gi, '_').toLowerCase()

    const content = `Call with: ${contactDisplay}\nCall Started: ${started}\nCall Ended: ${ended}\n\nTranscript:\n${transcriptText || '(no speech captured)'}\n`

    const timestampName = formatFilenameTimestamp(endedAt)
    const transcriptFilename = `call_transcript_${safeContactName}_${timestampName}.txt`

    const transcriptBlob = new Blob([content], { type: 'text/plain;charset=utf-8' })

    try {
      console.log('Saving locally to Projects/Calls Transcript...')

      // Save Transcript
      await fetch('/api/save-file', {
        method: 'POST',
        headers: { 'x-file-name': transcriptFilename },
        body: transcriptBlob
      })

      console.log('Local save complete')
      setError(null)
    } catch (err: any) {
      console.error('Local save failed:', err)
      setError('Failed to save files locally to the Projects folder.')
    }

    /*
    // FORMER ONEDRIVE UPLOAD LOGIC COMMENTED OUT
    if (account) {
      try {
        console.log('Uploading to OneDrive...')
        await uploadToOneDrive(instance, account, transcriptBlob, transcriptFilename)
        if (audioBlob) {
          await uploadToOneDrive(instance, account, audioBlob, recordingFilename)
        }
        console.log('Upload complete')
        setError(null)
      } catch (err: any) {
        console.error('Upload failed:', err)
        setError('Failed to upload files to OneDrive.')
      }
    } else {
      console.warn('No OneDrive account. Skipping upload.');
      setError('Please sign in to OneDrive to save recordings.');
    }
    */

    setFinalTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
    startTimeRef.current = null
    audioChunksRef.current = []
    setStartTime(null)
    setEndTime(null)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [account, instance])

  useEffect(() => {
    desiredActiveRef.current = desiredActive
  }, [desiredActive])

  useEffect(() => {
    if (!recognitionCtor) return

    const recognition = new recognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = async () => {
      setError(null)
      setStatus('Recording')
      setIsRecording(true)

      const startedAt = pendingStartTimeRef.current ?? startTimeRef.current ?? new Date()
      pendingStartTimeRef.current = null
      startTimeRef.current = startedAt
      setStartTime(startedAt)
      setEndTime(null)

      if (onRecordingStart) {
        onRecordingStart()
      }
    }

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = ''
      let finalForThisLoop = ''

      // Process all results from the current event
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalForThisLoop += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }

      if (finalForThisLoop) {
        finalTranscriptRef.current += finalForThisLoop
        setFinalTranscript(finalTranscriptRef.current.trim())
      }

      setInterimTranscript(interim.trim())

      if (onTranscriptChangeRef.current) {
        const fullTranscript = `${finalTranscriptRef.current} ${interim}`.trim()
        onTranscriptChangeRef.current(fullTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const code = event.error ?? ''

      // Do not hard-stop on errors unless it's a permission block.
      // Some browsers (like Chrome) emit 'no-speech' or 'network' errors and stop.
      // We rely on `onend` to restart it if desiredActive is still true.
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setStatus('Error')
        setError('Microphone permission is blocked. Please allow mic access and try again.')
        setIsRecording(false)
      } else {
        console.warn('Speech recognition error:', code)
      }
    }

    recognition.onend = () => {
      if (isManuallyStoppingRef.current) {
        isManuallyStoppingRef.current = false
        const finishedAt = pendingEndTimeRef.current ?? new Date()
        pendingEndTimeRef.current = null

        setIsRecording(false)
        setStatus('Idle')
        setEndTime(finishedAt)

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.onstop = () => {
            const startedAt = startTimeRef.current
            if (shouldDownloadOnStopRef.current && startedAt) {
              shouldDownloadOnStopRef.current = false
              finalizeAndDownloadTranscript(startedAt, finishedAt)
            } else {
              shouldDownloadOnStopRef.current = false
            }
          }
          mediaRecorderRef.current.stop()
        } else {
          const startedAt = startTimeRef.current
          if (shouldDownloadOnStopRef.current && startedAt) {
            shouldDownloadOnStopRef.current = false
            finalizeAndDownloadTranscript(startedAt, finishedAt)
          } else {
            shouldDownloadOnStopRef.current = false
          }
        }

        if (onRecordingEnd) {
          onRecordingEnd()
        }

        return
      }

      if (desiredActiveRef.current) {
        // Continuous mode in Chrome often randomly stops after a while or on silence.
        // If we still want to be active, we instantly restart it.
        // We use a small timeout because calling start() synchronously inside onend can throw an InvalidStateError in some browsers.
        setTimeout(() => {
          if (desiredActiveRef.current) {
            try {
              recognition.start()
            } catch (err) {
              console.warn('Failed to auto-restart speech recognition:', err)
            }
          }
        }, 100)
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

      // ONLY CLEAR ON FRESH START
      if (!isRecording && finalTranscriptRef.current === '' && audioChunksRef.current.length === 0) {
        // Safe baseline start
      } else if (!isRecording && (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive')) {
        finalTranscriptRef.current = ''
        setFinalTranscript('')
        setInterimTranscript('')
        audioChunksRef.current = []
      }

      const ensureMediaRecorder = async () => {
        if (!streamRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            })
            streamRef.current = stream
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data)
              }
            }

            mediaRecorder.start()
          } catch (err) {
            console.error('Failed to get user media', err)
            setError('Failed to capture audio for recording.')
          }
        }
      }

      ensureMediaRecorder()

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!account && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSignIn}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              Sign in to OneDrive
            </button>
          )}
          {account && (
            <span style={{ fontSize: '12px', color: 'green' }}>✓ Signed in</span>
          )}
          <span className={`call-recorder-status call-recorder-status--${status.toLowerCase()}`}>
            {status}
          </span>
        </div>
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

