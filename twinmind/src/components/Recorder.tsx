import React, { useEffect, useRef, useState } from 'react'

interface RecorderProps {
  onTranscriptComplete: (transcriptText: string) => void
  onRecordingChange: (isRecording: boolean) => void
  isRecording: boolean
}

type SpeechRecognitionType = InstanceType<
  NonNullable<
    typeof window extends { SpeechRecognition: infer R }
      ? R
      : typeof window extends { webkitSpeechRecognition: infer W }
        ? W
        : never
  >
>

const getSpeechRecognition = ():
  | (new () => SpeechRecognitionType)
  | null => {
  if (typeof window === 'undefined') return null
  // @ts-expect-error vendor-prefixed API
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const Recorder: React.FC<RecorderProps> = ({
  onTranscriptComplete,
  onRecordingChange,
  isRecording,
}) => {
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    const Recognition = getSpeechRecognition()
    if (Recognition) {
      setSupported(true)
      const recognition = new Recognition()
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.continuous = true

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          }
        }
        if (finalTranscript) {
          transcriptRef.current += `${finalTranscript} `
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(event.error || 'Speech recognition error.')
      }

      recognition.onend = () => {
        onRecordingChange(false)
        const finalText = (transcriptRef.current || '').trim()
        if (finalText) {
          onTranscriptComplete(finalText)
        }
        transcriptRef.current = ''
      }

      recognitionRef.current = recognition
    } else {
      setSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [onTranscriptComplete, onRecordingChange])

  const startRecording = () => {
    setError('')
    const recognition = recognitionRef.current
    if (!recognition) return
    transcriptRef.current = ''
    try {
      recognition.start()
      onRecordingChange(true)
    } catch {
      setError('Unable to start speech recognition.')
    }
  }

  const stopRecording = () => {
    const recognition = recognitionRef.current
    if (!recognition) return
    try {
      recognition.stop()
    } catch {
      setError('Unable to stop speech recognition.')
    }
  }

  if (!supported) {
    return (
      <div className="recorder">
        <button type="button" className="recorder-button" disabled>
          Recording not supported
        </button>
        <span className="recorder-status">
          Speech recognition is not available in this browser.
        </span>
      </div>
    )
  }

  return (
    <div className="recorder">
      <button
        type="button"
        className={`recorder-button ${isRecording ? 'recording' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <span className="recorder-status">
        {isRecording
          ? 'Listening… your words will be added to the knowledge base.'
          : 'Record a meeting to capture a transcript.'}
      </span>
      {error && <span className="recorder-error">{error}</span>}
    </div>
  )
}

export default Recorder

