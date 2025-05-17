"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

interface VoiceRecognitionProps {
  onResult: (transcript: string) => void
  isListening: boolean
  setIsListening: (isListening: boolean) => void
}

export default function VoiceRecognition({ onResult, isListening, setIsListening }: VoiceRecognitionProps) {
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Browser compatibility check
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError("Speech recognition is not supported in your browser.")
        return
      }

      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "en-US"

      // Add more detailed logging
      recognitionInstance.onstart = () => {
        console.log("Speech recognition started")
        setError(null)
      }

      recognitionInstance.onresult = (event: any) => {
        console.log("Speech recognition result received", event.results)
        const transcript = event.results[0][0].transcript
        setIsListening(false)
        onResult(transcript)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        let errorMessage = `Error: ${event.error}`
        
        // Provide more user-friendly error messages
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
      }

      recognitionInstance.onend = () => {
        console.log("Speech recognition ended")
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    return () => {
      if (recognition) {
        recognition.abort()
      }
    }
  }, [onResult, setIsListening])

  const toggleListening = async () => {
    if (isListening) {
      recognition?.abort()
      setIsListening(false)
    } else {
      try {
        await recognition?.start()
        setIsListening(true)
        setError(null)
      } catch (err) {
        console.error("Failed to start speech recognition:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to start speech recognition. Please try again."
        setError(errorMessage)
        setIsListening(false)
      }
    }
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <Button
        onClick={toggleListening}
        className={`rounded-full w-16 h-16 flex items-center justify-center ${
          isListening ? "bg-red-500 hover:bg-red-600" : "bg-[#0071e3] hover:bg-[#0077ed]"
        }`}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <p className="text-sm text-[#86868b] text-center">
        {isListening ? "Speak now..." : "Tap the microphone and say the letter you see"}
      </p>
    </div>
  )
}
