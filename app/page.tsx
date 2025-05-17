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

// Generate random string of lowercase letters
const generateRandomString = (length: number) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
}

// Initial font sizes in pixels for the first three levels
const INITIAL_SIZES = [48, 24, 12]

// Get size for current level (continues halving after initial sizes)
const getSizeForLevel = (level: number) => {
  if (level < INITIAL_SIZES.length) {
    return INITIAL_SIZES[level]
  }
  // After initial sizes, keep halving the last initial size
  return INITIAL_SIZES[INITIAL_SIZES.length - 1] / Math.pow(2, level - INITIAL_SIZES.length + 1)
}

// Color generator for levels beyond initial colors
const generateColor = (level: number) => {
  if (level < LEVEL_COLORS.length) {
    return LEVEL_COLORS[level]
  }
  // Generate new colors for additional levels
  const hue = (level * 137.5) % 360 // Golden angle progression for distinct colors
  return {
    bg: `hsl(${hue}, 85%, 97%)`,
    text: `hsl(${hue}, 85%, 45%)`
  }
}

// Simplified color palette (3 levels)
const LEVEL_COLORS = [
  { bg: '#F0F7FF', text: '#0066FF' },
  { bg: '#F3F0FF', text: '#6B2FFA' },
  { bg: '#FFF0F6', text: '#FA2FB7' }
]

// Calculate Snellen ratio based on smallest readable size
const calculateSnellenRatio = (sizeIndex: number) => {
  // Standard Snellen ratios for our font sizes
  // 48px -> 20/200 (significant impairment)
  // 24px -> 20/70  (mild impairment)
  // 12px -> 20/30  (near normal)
  // 6px  -> 20/25  (good)
  // 3px  -> 20/20  (normal)
  // Beyond that requires many more successful levels
  if (sizeIndex < INITIAL_SIZES.length) {
    switch(sizeIndex) {
      case 0: return "20/200"
      case 1: return "20/70"
      case 2: return "20/30"
      default: return "20/200"
    }
  } else {
    // For levels beyond initial sizes, require more levels for better scores
    const extraLevels = sizeIndex - INITIAL_SIZES.length + 1
    if (extraLevels <= 2) return "20/25"
    if (extraLevels <= 4) return "20/20"
    if (extraLevels <= 6) return "20/15"
    return "20/10" // Requires 7+ extra levels
  }
}

// Get vision quality description
const getVisionQuality = (sizeIndex: number) => {
  const extraLevels = Math.max(0, sizeIndex - INITIAL_SIZES.length + 1)
  if (extraLevels >= 6) return "Exceptional"
  if (extraLevels >= 4) return "Excellent"
  if (extraLevels >= 2 || sizeIndex >= 2) return "Good"
  if (sizeIndex >= 1) return "Below Average"
  return "Needs Attention"
}

export default function Home() {
  const [step, setStep] = useState<"intro" | "distance" | "test" | "results">("intro")
  const [currentString, setCurrentString] = useState("")
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0)
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [isListening, setIsListening] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastTranscript, setLastTranscript] = useState<string>("")
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)  // Track consecutive failures
  const router = useRouter()
  const synth = useRef<SpeechSynthesis | null>(null)
  const defaultVoice = useRef<SpeechSynthesisVoice | null>(null)
  const hasSpokenIntro = useRef(false)
  const defaultRate = useRef<number>(1.0)
  const defaultPitch = useRef<number>(1.0)

  const speakText = (text: string) => {
    if (synth.current) {
      // Cancel any ongoing speech
      if (synth.current.speaking) {
        synth.current.cancel()
      }
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Use the selected default voice
      if (defaultVoice.current) {
        utterance.voice = defaultVoice.current
      }
      
      // Faster voice settings
      utterance.rate = 1.25    // 25% faster speech
      utterance.pitch = 1.0    // Natural pitch
      utterance.volume = 0.95  // Comfortable listening level
      
      synth.current.speak(utterance)
    }
  }

  // Add natural pauses and emphasis to text
  const formatSpeech = (text: string) => {
    // Shorter pauses between segments
    return text.replace(/([.!?]) /g, '$1 ')   // Remove extra pauses after punctuation
              .replace(/(\d+)/g, ' $1 ')      // Add spaces around numbers
              .replace(/([,]) /g, '$1 ')      // Ensure spaces after commas
  }

  // Load and set the voice
  const loadVoices = () => {
    const voices = synth.current?.getVoices() || []
    console.log("Available voices:", voices.map(v => v.name))
    
    // Try to find Microsoft Aria Natural voice
    const ariaVoice = voices.find(v => 
      v.name.includes('Microsoft Aria Online (Natural)') ||  // Windows/Edge
      v.name.includes('Microsoft Aria') // Fallback
    )
    
    if (ariaVoice) {
      defaultVoice.current = ariaVoice
    } else {
      // Fallback voices if Aria is not available
      const fallbackVoices = [
        "Google US English",
        "Samantha",
        "Google UK English Female",
        "Microsoft Zira"
      ]
      
      for (const fallbackVoice of fallbackVoices) {
        const voice = voices.find(v => v.name.includes(fallbackVoice))
        if (voice) {
          defaultVoice.current = voice
          break
        }
      }
    }

    // Speak intro after voices are loaded
    if (!hasSpokenIntro.current) {
      speakText(formatSpeech("Hi! Ready to check your vision? Just read the letters when they appear, and I'll guide you through the test."))
      hasSpokenIntro.current = true
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      synth.current = window.speechSynthesis
      
      // Chrome requires a callback for voice loading
      if (synth.current?.addEventListener) {
        synth.current.addEventListener('voiceschanged', loadVoices)
      }
      
      // Initial load attempt
      loadVoices()
    }
    return () => {
      if (synth.current?.speaking) {
        synth.current.cancel()
      }
      if (synth.current?.removeEventListener) {
        synth.current.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [])

  const startTest = () => {
    setStep("distance")
    speakText(formatSpeech("Great! Hold your device at arm's length, about 40 centimeters away. Click continue when ready."))
  }

  const startLetterTest = () => {
    setStep("test")
    setCurrentString(generateRandomString(5))
    setCurrentSizeIndex(0)
    setResults({ correct: 0, total: 0 })
    setProgress(0)
    setLastTranscript("")
    speakText(formatSpeech("Perfect! Read the letters out loud."))
  }

  const restartTest = () => {
    setStep("intro")
    setCurrentString("")
    setCurrentSizeIndex(0)
    setResults({ correct: 0, total: 0 })
    setProgress(0)
    setLastTranscript("")
    if (synth.current && synth.current.speaking) {
      synth.current.cancel()
    }
  }

  const handleVoiceResult = (transcript: string) => {
    const normalizedTranscript = transcript.toLowerCase().replace(/\s+/g, '')
    const isCorrect = normalizedTranscript.includes(currentString)
    setLastTranscript(transcript)

    // Always update total attempts
    setResults((prev) => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }))

    if (isCorrect) {
      setFailedAttempts(0)  // Reset failed attempts on success
      
      // Continue to next level
      const nextSizeIndex = currentSizeIndex + 1
      setCurrentSizeIndex(nextSizeIndex)
      setCurrentString(generateRandomString(5))
      // Progress bar now shows progress through initial levels
      setProgress(Math.min((nextSizeIndex / INITIAL_SIZES.length) * 100, 100))
      speakText(formatSpeech("Good job! Next row."))
    } else {
      setFailedAttempts(prev => prev + 1)
      
      if (failedAttempts === 0) {
        // First failure - give another try
        setCurrentString(generateRandomString(5))  // New letters, same size
        speakText(formatSpeech("Let's try one more time with this size."))
      } else {
        // Second failure - end test
        setStep("results")
        let resultMessage = ""
        
        if (currentSizeIndex >= INITIAL_SIZES.length) {
          resultMessage = `Impressive! You made it past the standard test to level ${currentSizeIndex + 1}.`
        } else if (currentSizeIndex >= 2) {
          resultMessage = "Great results! Your vision looks strong."
        } else if (currentSizeIndex >= 1) {
          resultMessage = "Good effort! A quick check with an eye doctor might be helpful."
        } else {
          resultMessage = "Thanks for completing the test. I recommend scheduling an eye exam for a thorough check."
        }
        
        const finalScore = Math.round((results.correct / results.total) * 100)
        speakText(formatSpeech(`Test complete! Your accuracy was ${finalScore}%. ${resultMessage}`))
      }
    }
  }

  const currentColor = generateColor(currentSizeIndex)
  const currentSize = getSizeForLevel(currentSizeIndex)

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-[#6B2FFA]"></div>
            <h2 className="text-[15px] font-medium text-[#2C2C2C]">4Sight</h2>
          </div>
          {step !== "intro" && (
            <button 
              onClick={restartTest}
              className="text-[14px] text-[#2C2C2C] hover:text-[#6B2FFA] transition-colors"
            >
              Start Over
            </button>
          )}
        </div>

        {/* Title Section */}
        <div className="space-y-4 mb-8">
          <h1 className="text-[32px] font-semibold text-[#2C2C2C] tracking-tight">
            {step === "intro" && "Test Your Vision"}
            {step === "distance" && "Position Device"}
            {step === "test" && "Snellen Test"}
            {step === "results" && "Results"}
          </h1>
          <p className="text-[15px] text-[#666666] leading-relaxed">
            {step === "intro" && "A simple vision test using letter recognition and voice input"}
            {step === "distance" && "Ensure proper distance for accurate results"}
            {step === "test" && "Speak the letters clearly into your microphone"}
            {step === "results" && "Review your test results"}
          </p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
          {step === "intro" && (
            <div>
              <div className="px-8 py-10 bg-white">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-[15px] text-[#2C2C2C] leading-relaxed">
                      This app will test your vision using letters of decreasing size. You'll need to enable your microphone
                      to respond.
                    </p>
                    <p className="text-[14px] text-[#666666] leading-relaxed">
                      Speak clearly and read all letters from left to right.
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
                  onClick={startLetterTest}
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
                <div className="flex justify-between items-center">
                  <div 
                    style={{ backgroundColor: currentColor.bg }}
                    className="flex items-center space-x-3 py-2 px-4 rounded-lg"
                  >
                    <span className="text-[14px] font-medium" style={{ color: currentColor.text }}>
                      Level {currentSizeIndex + 1}
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
                    <a 
                      href="/peripheral"
                      className="text-[14px] text-[#6B2FFA] hover:text-[#5925D9] transition-colors"
                    >
                      Try Peripheral Test →
                    </a>
                    <a 
                      href="/gaze-tester/index.html"
                      className="text-[14px] text-[#6B2FFA] hover:text-[#5925D9] transition-colors"
                    >
                      Try Gaze Test →
                    </a>
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

                {/* Letters Display */}
                <div 
                  style={{ backgroundColor: currentColor.bg }}
                  className="flex flex-col items-center justify-center min-h-[200px] rounded-lg"
                >
                  <p 
                    style={{ 
                      fontSize: `${currentSize}px`,
                      color: currentColor.text
                    }} 
                    className="font-mono tracking-wide"
                  >
                    {currentString}
                  </p>
                </div>

                {/* Voice Recognition */}
                <VoiceRecognition
                  onResult={handleVoiceResult}
                  isListening={isListening}
                  setIsListening={setIsListening}
                />

                {/* Transcript */}
                {lastTranscript && (
                  <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-2">
                    <p className="text-[12px] text-[#666666] uppercase tracking-wider">Last heard</p>
                    <p className="text-[14px] text-[#2C2C2C]">{lastTranscript}</p>
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#666666]">Progress</span>
                    <span className="text-[12px] font-medium" style={{ color: currentColor.text }}>
                      Level {currentSizeIndex + 1} of {INITIAL_SIZES.length}
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
                  <div className="text-center space-y-2">
                    <p className="text-[15px] text-[#666666]">
                      You correctly identified {results.correct} out of {results.total} letter sets
                    </p>
                    <p className="text-[24px] font-semibold text-[#2C2C2C]">
                      Vision Score: {calculateSnellenRatio(currentSizeIndex)}
                    </p>
                    <p className="text-[14px] text-[#666666]">
                      Vision Quality: <span className="font-medium text-[#6B2FFA]">{getVisionQuality(currentSizeIndex)}</span>
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="bg-[#F3F0FF] p-6 rounded-lg space-y-3">
                      <h3 className="text-[14px] font-medium text-[#2C2C2C]">Test Performance</h3>
                      <div className="space-y-2">
                        <p className="text-[14px] text-[#666666]">
                          • Smallest text size read: {getSizeForLevel(currentSizeIndex)}px
                        </p>
                        <p className="text-[14px] text-[#666666]">
                          • Completed levels: {currentSizeIndex + 1}
                        </p>
                        <p className="text-[14px] text-[#666666]">
                          • Reading accuracy: {Math.round((results.correct / results.total) * 100)}%
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#F3F0FF] p-6 rounded-lg space-y-3">
                      <h3 className="text-[14px] font-medium text-[#2C2C2C]">Interpretation</h3>
                      <p className="text-[14px] text-[#666666] leading-relaxed">
                        {currentSizeIndex >= INITIAL_SIZES.length
                          ? `Your vision appears to be above average. You successfully read text beyond the standard test size, achieving a ${calculateSnellenRatio(currentSizeIndex)} vision score.`
                          : currentSizeIndex >= 2
                            ? `Your vision appears to be within normal range. You achieved a standard ${calculateSnellenRatio(currentSizeIndex)} vision score.`
                            : currentSizeIndex >= 1
                              ? `Your vision may need attention. Your current vision score is ${calculateSnellenRatio(currentSizeIndex)}, which suggests mild visual impairment.`
                              : `Your vision test results indicate a vision score of ${calculateSnellenRatio(currentSizeIndex)}. This suggests significant visual impairment that should be evaluated by an eye care professional.`}
                      </p>
                    </div>

                    <div className="bg-[#FFF4E5] p-4 rounded-lg">
                      <p className="text-[12px] text-[#B76E00] text-center">
                        This is not a medical diagnosis. Results may vary based on device screen and testing conditions. Please consult an eye care professional for a comprehensive evaluation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-[#F5F5F5] flex justify-between">
                <Button 
                  onClick={() => router.push('/peripheral')}
                  className="bg-white border border-[#6B2FFA] text-[#6B2FFA] hover:bg-[#F3F0FF] rounded-lg px-6 py-3 text-[14px] font-medium transition-all duration-200"
                >
                  Try Peripheral Test
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
    </main>
  )
}
