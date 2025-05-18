"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: {
    length: number;
    item(index: number): {
      item(index: number): {
        transcript: string;
      };
    };
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface VoiceRecognitionProps {
  onResult: (transcript: string) => void
  isListening: boolean
  setIsListening: (isListening: boolean) => void
}

export default function VoiceRecognition({ onResult, isListening, setIsListening }: VoiceRecognitionProps) {
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContext = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const animationFrame = useRef<number | null>(null)

  // Initialize audio context and analyser
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContext.current = new AudioContext()
      analyser.current = audioContext.current.createAnalyser()
      analyser.current.fftSize = 256
      return () => {
        if (audioContext.current?.state !== 'closed') {
          audioContext.current?.close()
        }
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current)
        }
      }
    }
  }, [])

  // Function to update audio level visualization
  const updateAudioLevel = () => {
    if (!analyser.current) return
    const dataArray = new Uint8Array(analyser.current.frequencyBinCount)
    analyser.current.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const normalizedLevel = Math.min(100, (average / 256) * 100) // Normalize to 0-100 range
    setAudioLevel(normalizedLevel)
    animationFrame.current = requestAnimationFrame(updateAudioLevel)
  }

  // Setup audio visualization
  const setupAudioVisualization = async () => {
    if (!audioContext.current || !analyser.current) return
    try {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      const source = audioContext.current.createMediaStreamSource(mediaStream.current)
      source.connect(analyser.current)
      updateAudioLevel()
    } catch (err) {
      console.error('Failed to setup audio visualization:', err)
    }
  }

  // Cleanup audio visualization
  const cleanupAudioVisualization = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop())
    }
    setAudioLevel(0)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError("Speech recognition is not supported in your browser.")
        return
      }

      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "en-US"

      recognitionInstance.onstart = () => {
        console.log("Speech recognition started")
        setError(null)
        setupAudioVisualization()
      }

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        console.log("Speech recognition result received", event.results)
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase()
        onResult(transcript)
      }

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error)
        let errorMessage = `Error: ${event.error}`
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = "Please allow microphone access to use speech recognition."
            break
          case 'no-speech':
            errorMessage = "No speech was detected. Please try again."
            break
          case 'network':
            errorMessage = "Network error occurred. Please check your connection."
            break
          case 'aborted':
            errorMessage = "Speech recognition was aborted."
            break
        }
        
        setError(errorMessage)
        setIsListening(false)
        cleanupAudioVisualization()
      }

      recognitionInstance.onend = () => {
        console.log("Speech recognition ended")
        if (isListening) {
          // If we're supposed to be listening, restart
          recognitionInstance.start()
        } else {
          cleanupAudioVisualization()
        }
      }

      setRecognition(recognitionInstance)
    }

    return () => {
      if (recognition) {
        recognition.abort()
      }
      cleanupAudioVisualization()
    }
  }, [onResult, setIsListening])

  useEffect(() => {
    if (recognition) {
      if (isListening) {
        try {
          // Stop any existing recognition first
          recognition.abort()
          cleanupAudioVisualization()
          
          // Small delay before starting new recognition
          setTimeout(() => {
            recognition.start()
            setupAudioVisualization()
          }, 100)
        } catch (err) {
          console.error("Failed to start recognition:", err)
          setError("Failed to start speech recognition. Please try again.")
          setIsListening(false)
        }
      } else {
        recognition.abort()
        cleanupAudioVisualization()
      }
    }
  }, [isListening, recognition])

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}
      
      {/* Audio Level Visualization */}
      {isListening && (
        <div className="w-full space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-100"
              style={{
                width: `${audioLevel}%`,
                backgroundColor: audioLevel > 50 ? '#6B2FFA' : '#12B76A'
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Quiet</span>
            <span>Loud</span>
          </div>
        </div>
      )}
    </div>
  )
}
