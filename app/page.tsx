"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Mic, Volume2 } from "lucide-react"
import DistanceGuide from "@/components/distance-guide"
import LetterDisplay from "@/components/letter-display"
import VoiceRecognition from "@/components/voice-recognition"

// Snellen chart letters (commonly used in eye tests)
const LETTERS = ["E", "F", "P", "T", "O", "Z", "L", "D", "C"]
// Font sizes in pixels, decreasing to simulate distance
const SIZES = [120, 100, 80, 60, 48, 36, 28, 22, 18]

export default function Home() {
  const [step, setStep] = useState<"intro" | "distance" | "test" | "results">("intro")
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0)
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [isListening, setIsListening] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastTranscript, setLastTranscript] = useState<string>("")
  const router = useRouter()
  const synth = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      synth.current = window.speechSynthesis
    }

    return () => {
      if (synth.current && synth.current.speaking) {
        synth.current.cancel()
      }
    }
  }, [])

  const speakText = (text: string) => {
    if (synth.current) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      synth.current.speak(utterance)
    }
  }

  const startTest = () => {
    setStep("distance")
    speakText("Position your device at arm's length, about 40 centimeters from your eyes. When ready, click continue.")
  }

  const startLetterTest = () => {
    setStep("test")
    setCurrentLetterIndex(Math.floor(Math.random() * LETTERS.length))
    setCurrentSizeIndex(0)
    setResults({ correct: 0, total: 0 })
    setProgress(0)

    setTimeout(() => {
      speakText("Please read the letter aloud when you see it.")
    }, 500)
  }

  const handleVoiceResult = (transcript: string) => {
    const currentLetter = LETTERS[currentLetterIndex]
    const isCorrect = transcript.toUpperCase().includes(currentLetter)
    setLastTranscript(transcript)

    setResults((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }))

    // Move to next letter or size
    if (currentSizeIndex < SIZES.length - 1) {
      const nextSizeIndex = currentSizeIndex + 1
      setCurrentSizeIndex(nextSizeIndex)
      setCurrentLetterIndex(Math.floor(Math.random() * LETTERS.length))
      setProgress((nextSizeIndex / (SIZES.length - 1)) * 100)
      
      // Add feedback for correct/incorrect answer
      if (isCorrect) {
        speakText("Correct. Next letter.")
      } else {
        speakText("Moving to next letter.")
      }
    } else {
      setStep("results")
      speakText("Test complete. View your results.")
    }
  }

  const restartTest = () => {
    setStep("intro")
    setCurrentSizeIndex(0)
    setResults({ correct: 0, total: 0 })
    setProgress(0)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-[#f5f5f7]">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-[32px] font-semibold text-center mb-8 text-[#1d1d1f] tracking-tight">
          {step === "intro" && "Vision Test"}
          {step === "distance" && "Position Your Device"}
          {step === "test" && "Read the Letter"}
          {step === "results" && "Test Results"}
        </h1>

        <Card className="p-8 shadow-sm bg-white rounded-2xl border-0">
          {step === "intro" && (
            <div className="space-y-8">
              <p className="text-[17px] leading-relaxed text-[#86868b] text-center font-medium">
                This app will test your vision using letters of decreasing size. You'll need to enable your microphone
                to respond.
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={startTest} 
                  className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-8 py-6 text-[17px] font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Test <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {step === "distance" && (
            <div className="space-y-8">
              <DistanceGuide />
              <div className="flex justify-center">
                <Button
                  onClick={startLetterTest}
                  className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-8 py-6 text-[17px] font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {step === "test" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-[#86868b]" />
                  <span className="text-[15px] text-[#86868b] font-medium">Read aloud</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mic className={`h-5 w-5 ${isListening ? "text-red-500" : "text-[#86868b]"}`} />
                  <span className="text-[15px] text-[#86868b] font-medium">
                    {isListening ? "Listening..." : "Click to speak"}
                  </span>
                </div>
              </div>

              <LetterDisplay letter={LETTERS[currentLetterIndex]} size={SIZES[currentSizeIndex]} />

              <VoiceRecognition
                onResult={handleVoiceResult}
                isListening={isListening}
                setIsListening={setIsListening}
              />

              {lastTranscript && (
                <div className="bg-[#f5f5f7] rounded-xl p-4">
                  <p className="text-[13px] text-[#86868b] font-medium">Last heard:</p>
                  <p className="text-[15px] text-[#1d1d1f] font-medium mt-1">{lastTranscript}</p>
                </div>
              )}

              <div className="space-y-3">
                <Progress 
                  value={progress} 
                  className="h-1.5 bg-[#e5e5ea]" 
                  indicatorClassName="bg-[#0071e3]"
                />
                <p className="text-[13px] text-center text-[#86868b] font-medium">
                  {currentSizeIndex + 1} of {SIZES.length}
                </p>
              </div>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <p className="text-[48px] font-bold text-[#1d1d1f] tracking-tight">
                  {Math.round((results.correct / results.total) * 100)}%
                </p>
                <p className="text-[17px] text-[#86868b] font-medium">
                  You correctly identified {results.correct} out of {results.total} letters.
                </p>
              </div>

              <div className="bg-[#f5f5f7] p-6 rounded-2xl space-y-3">
                <h3 className="font-semibold text-[17px] text-[#1d1d1f]">Interpretation</h3>
                <p className="text-[15px] text-[#86868b] leading-relaxed">
                  {results.correct / results.total >= 0.8
                    ? "Your vision appears to be good. You were able to identify most letters correctly."
                    : results.correct / results.total >= 0.6
                      ? "Your vision may need some attention. Consider consulting with an eye care professional."
                      : "Your vision test results suggest you should consult with an eye care professional for a comprehensive examination."}
                </p>
              </div>

              <div className="text-[13px] text-[#86868b] text-center font-medium italic">
                This is not a medical diagnosis. Please consult a healthcare professional for proper evaluation.
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={restartTest} 
                  className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-8 py-6 text-[17px] font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Test Again
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
