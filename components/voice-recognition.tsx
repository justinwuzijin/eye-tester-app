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
  const isProcessingResult = useRef(false)
  const recognitionStarting = useRef(false)

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

  const startRecognition = async () => {
    if (!recognition || recognitionStarting.current || isProcessingResult.current) return

    try {
      recognitionStarting.current = true
      console.log("Starting recognition...")
      
      // Ensure clean state
      recognition.abort()
      cleanupAudioVisualization()
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Start recognition
      await setupAudioVisualization()
      recognition.start()
      
    } catch (err) {
      console.error("Failed to start recognition:", err)
      setError("Failed to start speech recognition. Please try again.")
      setIsListening(false)
    } finally {
      recognitionStarting.current = false
    }
  }

  const stopRecognition = () => {
    if (!recognition) return
    console.log("Stopping recognition...")
    recognition.abort()
    cleanupAudioVisualization()
    isProcessingResult.current = false
  }

  const processTranscript = (transcript: string): string => {
    // Convert to lowercase and remove extra spaces
    let processed = transcript.toLowerCase().trim()
    
    // Common TTS word-to-letter mappings
    const wordToLetter: { [key: string]: string } = {
      'why': 'y',
      'are': 'r',
      'see': 'c',
      'oh': 'o',
      'bee': 'b',
      'be': 'b',
      // Additional common interpretations
      'eye': 'i',
      'you': 'u',
      'tea': 't',
      'sea': 'c',
      'kay': 'k',
      'jay': 'j',
      'eh': 'a',
      'aye': 'a',
      'em': 'm',
      'en': 'n',
      'pee': 'p',
      'cue': 'q',
      'double u': 'w',
      'double you': 'w',
      'ex': 'x',
      'zee': 'z',
      'zed': 'z',
      // Numbers that might be interpreted as words
      'one': '1',
      'two': '2',
      'three': '3',
      'four': '4',
      'five': '5',
      'six': '6',
      'seven': '7',
      'eight': '8',
      'nine': '9',
      'zero': '0'
    }
    
    // Split into words and process each
    processed = processed.split(' ').map(word => {
      // Check if this word should be converted to a letter
      return wordToLetter[word] || word
    }).join('')
    
    return processed
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError("Speech recognition is not supported in your browser.")
        return
      }

      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "en-US"

      recognitionInstance.onstart = () => {
        console.log("Speech recognition started")
        setError(null)
      }

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        console.log("Speech recognition result received", event.results)
        const rawTranscript = event.results[event.results.length - 1][0].transcript.toLowerCase()
        console.log("Raw transcript:", rawTranscript)
        
        // Process the transcript to handle TTS word interpretations
        const processedTranscript = processTranscript(rawTranscript)
        console.log("Processed transcript:", processedTranscript)
        
        // Stop listening and process result
        isProcessingResult.current = true
        stopRecognition()
        onResult(processedTranscript)
      }

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Ignore abort errors when we're stopping intentionally
        if (event.error === 'aborted' && !isListening) {
          return
        }

        console.error("Speech recognition error:", event.error)
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
        stopRecognition()
      }

      recognitionInstance.onend = () => {
        console.log("Speech recognition ended")
        
        // If we should still be listening and aren't processing a result, restart
        if (isListening && !isProcessingResult.current && !recognitionStarting.current) {
          console.log("Restarting recognition...")
          startRecognition()
        }
      }

      setRecognition(recognitionInstance)
    }

    return () => {
      stopRecognition()
    }
  }, [onResult, setIsListening, isListening])

  // Handle isListening prop changes
  useEffect(() => {
    if (!recognition) return

    if (isListening && !isProcessingResult.current && !recognitionStarting.current) {
      startRecognition()
    } else if (!isListening) {
      stopRecognition()
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
