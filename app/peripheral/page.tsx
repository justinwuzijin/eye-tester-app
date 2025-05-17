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

// Simplified color palette (reduced levels)
const LEVEL_COLORS = [
  { bg: '#F0F7FF', text: '#0066FF' },
  { bg: '#F3F0FF', text: '#6B2FFA' },
  { bg: '#FFF0F6', text: '#FA2FB7' }
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
  const defaultVoice = useRef<SpeechSynthesisVoice | null>(null)
  const hasSpokenIntro = useRef(false)
  const defaultRate = useRef<number>(1.0)
  const defaultPitch = useRef<number>(1.0)

  // Load and set the voice
  const loadVoices = () => {
    const voices = synth.current?.getVoices() || [];
    console.log("Available voices:", voices.map(v => ({ name: v.name, lang: v.lang })));
    
    // Expanded list of preferred voices
    const preferredVoices = [
      // Premium natural voices
      "Microsoft Aria Online (Natural)",  // Windows/Edge
      "Microsoft Guy Online (Natural)",   // Windows/Edge
      "Google UK English Male",           // Chrome
      "Google UK English Female",         // Chrome
      "Karen",                           // macOS
      "Daniel",                          // macOS
      "Moira",                           // macOS
      "Samantha",                        // macOS/iOS
      "Microsoft David",                 // Windows
      "Microsoft Mark",                  // Windows
      "Microsoft Zira",                  // Windows
      // Fallback to any English voice if none of the above are found
      "en-US",
      "en-GB",
      "en"
    ];
    
    // Try to find the best available voice
    for (const preferredVoice of preferredVoices) {
      const voice = voices.find(v => 
        v.name.includes(preferredVoice) || 
        v.lang.startsWith(preferredVoice)
      );
      
      if (voice) {
        console.log("Selected voice:", voice.name);
        defaultVoice.current = voice;
        break;
      }
    }

    // Speak intro after voices are loaded
    if (!hasSpokenIntro.current) {
      setTimeout(() => {
        speakText(formatSpeech("Hi! Let's check how well you can spot things in your side vision. Keep your eyes on the center dot and tell me what letters you see!"))
        hasSpokenIntro.current = true;
      }, 1000);
    }
  };

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

  const speakText = (text: string) => {
    if (synth.current) {
      // Cancel any ongoing speech
      if (synth.current.speaking) {
        synth.current.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use the selected default voice
      if (defaultVoice.current) {
        utterance.voice = defaultVoice.current;
      }
      
      // Faster voice settings
      utterance.rate = 1.25;    // Increased speed (25% faster)
      utterance.pitch = 1.0;    // Natural pitch
      utterance.volume = 0.95;  // Comfortable listening level
      
      synth.current.speak(utterance);
    }
  };

  // Add natural pauses and emphasis to text
  const formatSpeech = (text: string) => {
    // Add commas for natural pauses
    return text.replace(/([.!?]) /g, '$1, ')  // Add slight pauses after punctuation
              .replace(/(\d+)/g, ' $1 ')      // Add spaces around numbers
              .replace(/([,]) /g, '$1 ')      // Ensure spaces after commas
  }

  const startTest = () => {
    setStep("distance")
    speakText(formatSpeech("Great! Hold your device at arm's length, about 40 centimeters away. Ready when you are!"))
  }

  const startPeripheralTest = () => {
    setResults({ correct: 0, total: 0 })
    setStep("test")
    const newLetter = generateRandomLetter()
    const newPosition = generateRandomPosition()
    setCurrentLetter(newLetter)
    setCurrentPosition(newPosition)
    setCurrentLevel(0)
    setProgress(0)
    setLastTranscript("")
    setTimeout(() => {
      speakText(formatSpeech("Keep your eyes on the center dot and tell me what letters you see!"))
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
        speakText(formatSpeech("Nice! Keep going!"))
      } else {
        setStep("results")
        const score = Math.round((results.correct / results.total) * 100)
        let resultMessage = ""
        
        if (score >= 80) {
          resultMessage = "Excellent peripheral vision! You spotted those letters really well."
        } else if (score >= 60) {
          resultMessage = "Good effort! A quick check with an eye doctor might help improve your side vision."
        } else {
          resultMessage = "Thanks for trying! Let's have an eye doctor take a closer look at your peripheral vision."
        }
        
        setTimeout(() => {
          speakText(formatSpeech(`All done! ${resultMessage}`))
        }, 500)
      }
    } else {
      setResults((prev) => ({
        ...prev,
        total: prev.total + 1,
      }))
      speakText(formatSpeech("No worries! Let's try another one."))
    }
  }

  const currentColor = LEVEL_COLORS[currentLevel]

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#FAFAFA] dark:from-gray-900 dark:to-gray-800">
      <div className="w-screen px-0 py-16">
        {/* Header */}
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-sm bg-[#6B2FFA]"></div>
              <h2 className="text-[15px] font-medium text-[#2C2C2C] dark:text-gray-200">4Sight</h2>
            </div>
            {step !== "intro" && (
              <div className="flex items-center space-x-4">
                <a 
                  href="/"
                  className="text-[14px] text-[#6B2FFA] hover:text-[#5925D9] dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
                >
                  ← Back to Snellen Test
                </a>
                <button 
                  onClick={() => setStep("results")}
                  className="text-[14px] text-[#6B2FFA] hover:text-[#5925D9] dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
                  aria-label="View latest test results"
                >
                  View Results
                </button>
                <button 
                  onClick={restartTest}
                  className="text-[14px] text-[#2C2C2C] hover:text-[#6B2FFA] dark:text-gray-200 dark:hover:text-purple-300 transition-colors"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title Section */}
        <div className="max-w-2xl mx-auto px-6 space-y-4 mb-8">
          <h1 className="text-[32px] font-semibold text-[#2C2C2C] dark:text-gray-200 tracking-tight">
            {step === "intro" && "Peripheral Vision Test"}
            {step === "distance" && "Position Device"}
            {step === "test" && "Peripheral Test"}
            {step === "results" && "Results"}
          </h1>
          <p className="text-[15px] text-[#666666] dark:text-gray-400 leading-relaxed">
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
                <div className="px-8 py-10 bg-white dark:bg-gray-800">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <p className="text-[15px] text-[#2C2C2C] dark:text-gray-200 leading-relaxed">
                        Quick and easy! Focus on the center dot and tell me what letters you see around it.
                      </p>
                      <p className="text-[14px] text-[#666666] dark:text-gray-400 leading-relaxed">
                        Just speak clearly and keep your eyes on the center.
                      </p>
                    </div>
                    
                    <MicrophoneSetup onPermissionGranted={() => setMicPermissionGranted(true)} />
                  </div>
                </div>
                <div className="px-8 py-6 bg-[#F5F5F5] dark:bg-gray-700 flex justify-end">
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
              <div className="relative w-screen h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                {/* Center dot */}
                <div 
                  className="absolute w-4 h-4 rounded-full bg-[#6B2FFA] dark:bg-purple-300"
                  style={{ left: 'calc(50% - 8px)', top: 'calc(50% - 8px)' }}
                ></div>
                
                {/* Peripheral letter */}
                {currentLetter && currentPosition && (
                  <div 
                    className="absolute text-4xl font-bold text-[#2C2C2C] dark:text-gray-200"
                    style={{
                      left: `${currentPosition.x}px`,
                      top: `${currentPosition.y}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {currentLetter}
                  </div>
                )}

                {/* Progress bar */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-64">
                  <div className="h-2 bg-[#F3F0FF] dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#6B2FFA] dark:bg-purple-300 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {step === "results" && (
              <div>
                <div className="px-8 py-10 bg-white dark:bg-gray-800">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[16px] font-medium text-[#2C2C2C] dark:text-gray-200 mb-1">
                            Your Score
                          </h3>
                          <p className="text-[14px] text-[#666666] dark:text-gray-400">
                            Based on letter identification accuracy
                          </p>
                        </div>
                        <div className="text-[32px] font-semibold text-[#6B2FFA] dark:text-purple-300">
                          {Math.round((results.correct / results.total) * 100)}%
                        </div>
                      </div>
                    </div>

                    <div 
                      className="bg-[#F3F0FF] dark:bg-gray-700 p-6 rounded-lg space-y-3"
                      role="region"
                      aria-label="Test Interpretation"
                      tabIndex={0}
                    >
                      <h3 className="text-[14px] font-medium text-[#2C2C2C] dark:text-gray-200">Interpretation</h3>
                      <p className="text-[14px] text-[#666666] dark:text-gray-400 leading-relaxed">
                        {results.correct / results.total >= 0.8
                          ? "Your peripheral vision appears to be good. You were able to identify most letters correctly while maintaining central focus."
                          : results.correct / results.total >= 0.6
                            ? "Your peripheral vision may need some attention. Consider consulting with an eye care professional."
                            : "Your peripheral vision test results suggest you should consult with an eye care professional for a comprehensive examination."}
                      </p>
                    </div>

                    <div 
                      className="bg-[#FFF4E5] dark:bg-yellow-900 p-4 rounded-lg"
                      role="alert"
                      aria-live="polite"
                    >
                      <p className="text-[12px] text-[#B76E00] dark:text-yellow-200 text-center">
                        This is not a medical diagnosis. Please consult a healthcare professional for proper evaluation.
                      </p>
                    </div>

                    <div className="flex items-center justify-center space-x-4 mt-6">
                      <button
                        onClick={() => {
                          const score = Math.round((results.correct / results.total) * 100)
                          let resultMessage = ""
                          
                          if (score >= 80) {
                            resultMessage = "Your peripheral vision appears to be good. You were able to identify most letters correctly while maintaining central focus."
                          } else if (score >= 60) {
                            resultMessage = "Your peripheral vision may need some attention. Consider consulting with an eye care professional."
                          } else {
                            resultMessage = "Your peripheral vision test results suggest you should consult with an eye care professional for a comprehensive examination."
                          }
                          
                          speakText(`Your score is ${score}%. ${resultMessage}`)
                        }}
                        className="flex items-center space-x-2 text-[14px] text-[#6B2FFA] hover:text-[#5925D9] dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
                        aria-label="Read results aloud"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span>Read Results</span>
                      </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-[#E6E6E6] dark:border-gray-600">
                      <div className="text-center">
                        <h3 className="text-[16px] font-medium text-[#2C2C2C] dark:text-gray-200 mb-2">
                          View Detailed Analysis
                        </h3>
                        <p className="text-[14px] text-[#666666] dark:text-gray-400 mb-4">
                          See a comprehensive breakdown of your vision test results
                        </p>
                        <a
                          href="/results"
                          className="inline-flex items-center justify-center space-x-2 bg-[#F3F0FF] dark:bg-gray-700 text-[#6B2FFA] dark:text-purple-300 hover:bg-[#E6E0FF] dark:hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            // Store results in localStorage
                            const score = Math.round((results.correct / results.total) * 100);
                            localStorage.setItem('peripheralAccuracy', `${score}%`);
                            // Navigate to results page
                            router.push('/results');
                          }}
                        >
                          <span className="text-[14px] font-medium">View Detailed Results</span>
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-[#F5F5F5] dark:bg-gray-700 flex justify-between">
                  <Button 
                    onClick={() => router.push('/')}
                    className="bg-white dark:bg-gray-800 border border-[#6B2FFA] dark:border-purple-300 text-[#6B2FFA] dark:text-purple-300 hover:bg-[#F3F0FF] dark:hover:bg-gray-700 rounded-lg px-6 py-3 text-[14px] font-medium transition-all duration-200"
                    aria-label="Return to Snellen Test"
                  >
                    Back to Snellen Test
                  </Button>
                  <Button 
                    onClick={restartTest} 
                    className="bg-[#6B2FFA] hover:bg-[#5925D9] text-white rounded-lg px-6 py-3 text-[14px] font-medium transition-all duration-200"
                    aria-label="Start a new peripheral vision test"
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