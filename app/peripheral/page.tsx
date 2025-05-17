"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Mic, Volume2 } from "lucide-react"
import DistanceGuide from "@/components/distance-guide"
import VoiceRecognition from "@/components/voice-recognition"
import MicrophoneSetup from "@/components/microphone-setup"

// Generate random position for the letter
const generateRandomPosition = () => {
  const positions = [
    { top: '8%', left: '2%' },
    { top: '8%', right: '2%' },
    { top: '30%', left: '1%' },
    { top: '30%', right: '1%' },
    { top: '50%', left: '1%' },
    { top: '50%', right: '1%' },
    { bottom: '30%', left: '1%' },
    { bottom: '30%', right: '1%' },
    { bottom: '8%', left: '2%' },
    { bottom: '8%', right: '2%' }
  ]
  return positions[Math.floor(Math.random() * positions.length)]
}

// Generate random letter
const generateRandomLetter = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return letters[Math.floor(Math.random() * letters.length)]
}

// Simplified color palette (same as Snellen test)
const LEVEL_COLORS = [
  { bg: '#F0F7FF', text: '#0066FF' },
  { bg: '#F3F0FF', text: '#6B2FFA' },
  { bg: '#FFF0F6', text: '#FA2FB7' },
  { bg: '#FFF4E5', text: '#FF8A00' },
  { bg: '#ECFDF3', text: '#12B76A' }
]

export default function PeripheralTest() {
  const [step, setStep] = useState<"intro" | "distance" | "test" | "results">("intro")
  const [currentLetter, setCurrentLetter] = useState("")
  const [currentPosition, setCurrentPosition] = useState<any>(null)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [isListening, setIsListening] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastTranscript, setLastTranscript] = useState<string>("")
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
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
    speakText("Position your device at arm's length, about 40 centimeters from your eyes. Focus on the center dot. When ready, click continue.")
  }

  const startPeripheralTest = () => {
    setStep("test")
    const newLetter = generateRandomLetter()
    const newPosition = generateRandomPosition()
    setCurrentLetter(newLetter)
    setCurrentPosition(newPosition)
    setCurrentLevel(0)
    setResults({ correct: 0, total: 0 })
    setProgress(0)
    setLastTranscript("")
    setTimeout(() => {
      speakText("Level 1. Keep your eyes on the center dot and say the letter you see in your peripheral vision.")
    }, 500)
  }

  const restartTest = () => {
    setStep("intro")
    setCurrentLetter("")
    setCurrentPosition(null)
    setCurrentLevel(0)
    setResults({ correct: 0, total: 0 })
    setProgress(0)
    setLastTranscript("")
    if (synth.current && synth.current.speaking) {
      synth.current.cancel()
    }
  }

  const handleVoiceResult = (transcript: string) => {
    const normalizedTranscript = transcript.toLowerCase().replace(/\s+/g, '')
    const isCorrect = normalizedTranscript.includes(currentLetter.toLowerCase())
    setLastTranscript(transcript)

    if (isCorrect) {
      setResults((prev) => ({
        correct: prev.correct + 1,
        total: prev.total + 1,
      }))

      if (currentLevel < LEVEL_COLORS.length - 1) {
        const nextLevel = currentLevel + 1
        setCurrentLevel(nextLevel)
        setCurrentLetter(generateRandomLetter())
        setCurrentPosition(generateRandomPosition())
        setProgress((nextLevel / (LEVEL_COLORS.length - 1)) * 100)
        speakText(`Correct. Level ${nextLevel + 1}.`)
      } else {
        setStep("results")
        speakText("Test complete. View your results.")
      }
    } else {
      setResults((prev) => ({
        ...prev,
        total: prev.total + 1,
      }))
      speakText(`Incorrect. Please try again for level ${currentLevel + 1}.`)
    }
  }

  const currentColor = LEVEL_COLORS[currentLevel]

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#FAFAFA]">
      <div className="w-screen px-0 py-16">
        {/* Header */}
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-[#6B2FFA]"></div>
              <h2 className="text-[15px] font-medium text-[#2C2C2C]">4Sight</h2>
            </div>
            {step !== "intro" && (
              <div className="flex items-center space-x-4">
                <a 
                  href="/"
                  className="text-[14px] text-[#6B2FFA] hover:text-[#5925D9] transition-colors"
                >
                  ← Back to Snellen Test
                </a>
                <button 
                  onClick={restartTest}
                  className="text-[14px] text-[#2C2C2C] hover:text-[#6B2FFA] transition-colors"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title Section */}
        <div className="max-w-2xl mx-auto px-6 space-y-4 mb-8">
          <h1 className="text-[32px] font-semibold text-[#2C2C2C] tracking-tight">
            {step === "intro" && "Peripheral Vision Test"}
            {step === "distance" && "Position Device"}
            {step === "test" && "Peripheral Test"}
            {step === "results" && "Results"}
          </h1>
          <p className="text-[15px] text-[#666666] leading-relaxed">
            {step === "intro" && "Test your peripheral vision by identifying letters while focusing on a central point"}
            {step === "distance" && "Ensure proper distance for accurate results"}
            {step === "test" && "Keep your eyes on the center dot and identify the letter"}
            {step === "results" && "Review your test results"}
          </p>
        </div>

        {/* Main Card */}
        <div className={step === "test" ? "w-screen" : "max-w-2xl mx-auto px-6"}>
          <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
            {step === "intro" && (
              <div>
                <div className="px-8 py-10 bg-white">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <p className="text-[15px] text-[#2C2C2C] leading-relaxed">
                        This test will assess your peripheral vision. Focus on the center dot while identifying letters that appear in different positions.
                      </p>
                      <p className="text-[14px] text-[#666666] leading-relaxed">
                        Speak clearly when you see each letter. Keep your eyes fixed on the center.
                      </p>
                    </div>
                    
                    <MicrophoneSetup onPermissionGranted={() => setMicPermissionGranted(true)} />
                  </div>
                </div>
                <div className="px-8 py-6 bg-[#F5F5F5] flex justify-end">
                  <Button 
                    onClick={startTest}
                    disabled={!micPermissionGranted}
                    className={`bg-[#6B2FFA] hover:bg-[#5925D9] text-white rounded-lg px-6 py-3 text-[14px] font-medium transition-all duration-200 ${
                      !micPermissionGranted && 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    Start Test <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "distance" && (
              <div>
                <div className="px-8 py-10 bg-white">
                  <DistanceGuide />
                </div>
                <div className="px-8 py-6 bg-[#F5F5F5] flex justify-end">
                  <Button
                    onClick={startPeripheralTest}
                    className="bg-[#6B2FFA] hover:bg-[#5925D9] text-white rounded-lg px-6 py-3 text-[14px] font-medium transition-all duration-200"
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "test" && (
              <div>
                <div className="px-8 py-10 bg-white space-y-8">
                  {/* Level Indicator */}
                  <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <div 
                      style={{ backgroundColor: currentColor.bg }}
                      className="flex items-center space-x-3 py-2 px-4 rounded-lg"
                    >
                      <span className="text-[14px] font-medium" style={{ color: currentColor.text }}>
                        Level {currentLevel + 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-[14px] font-medium text-[#2C2C2C]">
                        Score: {results.correct}/{results.total}
                        {results.total > 0 && (
                          <span className="ml-2 text-[#666666]">
                            ({Math.round((results.correct / results.total) * 100)}%)
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center space-x-3 py-2 px-4 rounded-lg ${
                        isListening ? 'bg-[#F3F0FF] text-[#6B2FFA]' : 'bg-[#F5F5F5] text-[#2C2C2C]'
                      }`}>
                        <Mic className="h-4 w-4" />
                        <span className="text-[14px]">
                          {isListening ? "Listening..." : "Click to speak"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Test Display */}
                  <div 
                    style={{ backgroundColor: currentColor.bg }}
                    className="relative flex items-center justify-center w-screen h-[70vh] rounded-none"
                  >
                    {/* Center Dot */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black" />
                    
                    {/* Peripheral Letter */}
                    <div 
                      style={{ 
                        position: 'absolute',
                        ...currentPosition,
                        color: currentColor.text,
                        fontSize: '48px',
                        fontFamily: 'monospace',
                        fontWeight: '600'
                      }}
                    >
                      {currentLetter}
                    </div>
                  </div>

                  {/* Voice Recognition and Progress Section */}
                  <div className="max-w-2xl mx-auto">
                    {/* Voice Recognition */}
                    <VoiceRecognition
                      onResult={handleVoiceResult}
                      isListening={isListening}
                      setIsListening={setIsListening}
                    />

                    {/* Transcript */}
                    {lastTranscript && (
                      <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-2 mt-8">
                        <p className="text-[12px] text-[#666666] uppercase tracking-wider">Last heard</p>
                        <p className="text-[14px] text-[#2C2C2C]">{lastTranscript}</p>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="space-y-3 mt-8">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#666666]">Progress</span>
                        <span className="text-[12px] font-medium" style={{ color: currentColor.text }}>
                          Level {currentLevel + 1} of {LEVEL_COLORS.length}
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-1 bg-[#E6E6E6]"
                        indicatorClassName="bg-[#6B2FFA]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "results" && (
              <div>
                <div className="px-8 py-10 bg-white space-y-8">
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-[#F3F0FF] flex items-center justify-center">
                      <p className="text-[40px] font-semibold text-[#6B2FFA]">
                        {Math.round((results.correct / results.total) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-[15px] text-center text-[#666666]">
                      You correctly identified {results.correct} out of {results.total} peripheral letters
                    </p>

                    <div className="bg-[#F3F0FF] p-6 rounded-lg space-y-3">
                      <h3 className="text-[14px] font-medium text-[#2C2C2C]">Interpretation</h3>
                      <p className="text-[14px] text-[#666666] leading-relaxed">
                        {results.correct / results.total >= 0.8
                          ? "Your peripheral vision appears to be good. You were able to identify most letters correctly while maintaining central focus."
                          : results.correct / results.total >= 0.6
                            ? "Your peripheral vision may need some attention. Consider consulting with an eye care professional."
                            : "Your peripheral vision test results suggest you should consult with an eye care professional for a comprehensive examination."}
                      </p>
                    </div>

                    <div className="bg-[#FFF4E5] p-4 rounded-lg">
                      <p className="text-[12px] text-[#B76E00] text-center">
                        This is not a medical diagnosis. Please consult a healthcare professional for proper evaluation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-[#F5F5F5] flex justify-between">
                  <Button 
                    onClick={() => router.push('/')}
                    className="bg-white border border-[#6B2FFA] text-[#6B2FFA] hover:bg-[#F3F0FF] rounded-lg px-6 py-3 text-[14px] font-medium transition-all duration-200"
                  >
                    Back to Snellen Test
                  </Button>
                  <Button 
                    onClick={restartTest} 
                    className="bg-[#6B2FFA] hover:bg-[#5925D9] text-white rounded-lg px-6 py-3 text-[14px] font-medium transition-all duration-200"
                  >
                    Test Again
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
} 