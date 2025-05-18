"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
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

// Define Snellen level interface
interface SnellenLevel {
  ratio: string;
  multiplier: number;
  fontSizePt: number;
  fontSizePx: number;
}

// Define Snellen levels from worst to best vision
const SNELLEN_LEVELS: SnellenLevel[] = [
  { ratio: "20/200", multiplier: 10, fontSizePt: 40, fontSizePx: 53.3 },
  { ratio: "20/160", multiplier: 8, fontSizePt: 32, fontSizePx: 42.7 },
  { ratio: "20/125", multiplier: 6.25, fontSizePt: 25, fontSizePx: 33.3 },
  { ratio: "20/100", multiplier: 5, fontSizePt: 20, fontSizePx: 26.6 },
  { ratio: "20/80", multiplier: 4, fontSizePt: 16, fontSizePx: 21.3 },
  { ratio: "20/63", multiplier: 3.15, fontSizePt: 12.6, fontSizePx: 16.8 },
  { ratio: "20/50", multiplier: 2.5, fontSizePt: 10, fontSizePx: 13.3 },
  { ratio: "20/40", multiplier: 2, fontSizePt: 8, fontSizePx: 10.7 },
  { ratio: "20/32", multiplier: 1.6, fontSizePt: 6.4, fontSizePx: 8.5 },
  { ratio: "20/25", multiplier: 1.25, fontSizePt: 5, fontSizePx: 6.7 },
  { ratio: "20/20", multiplier: 1, fontSizePt: 4, fontSizePx: 5 }
]

const getCurrentLevel = (index: number) => SNELLEN_LEVELS[index]

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
  const [currentLogo, setCurrentLogo] = useState<"logo" | "jamblink1" | "jamblink2">("logo")
  const [currentString, setCurrentString] = useState("")
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0) // Start with largest size (20/200)
  const [results, setResults] = useState<{ prescription: string; lastCorrectIndex: number }>({
    prescription: SNELLEN_LEVELS[0].ratio, // Start with worst vision
    lastCorrectIndex: 0
  })
  const [isListening, setIsListening] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastTranscript, setLastTranscript] = useState<string>("")
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)  // Track wrong attempts at current level
  const [micStatus, setMicStatus] = useState<"inactive" | "active" | "error">("inactive")
  const [isCorrectDistance, setIsCorrectDistance] = useState(false)
  const router = useRouter()
  const synth = useRef<SpeechSynthesis | null>(null)
  const defaultVoice = useRef<SpeechSynthesisVoice | null>(null)
  const hasSpokenIntro = useRef(false)
  const defaultRate = useRef<number>(1.0)
  const defaultPitch = useRef<number>(1.0)
  const activationSound = useRef<HTMLAudioElement | null>(null)
  const deactivationSound = useRef<HTMLAudioElement | null>(null)

  // Logo blinking effect
  useEffect(() => {
    if (step !== "intro") return;

    // Function to perform one blink cycle
    const doBlink = () => {
      // Quick transition to first blink state
      setCurrentLogo("jamblink1");
      
      // After 100ms, transition to closed eye
      setTimeout(() => {
        setCurrentLogo("jamblink2");
        
        // After another 100ms, go directly back to open
        setTimeout(() => {
          setCurrentLogo("logo");
        }, 100);
      }, 100);
    };

    // Function to schedule next blink with random interval
    const scheduleNextBlink = () => {
      // Random interval between 500ms (0.5s) and 5000ms (5s)
      const nextBlinkDelay = Math.random() * 4500 + 500;
      return setTimeout(doBlink, nextBlinkDelay);
    };

    // Function to handle continuous random blinking
    const startRandomBlinking = () => {
      doBlink(); // Initial blink
      let timeoutId = scheduleNextBlink();

      // Set up recurring random intervals
      const intervalId = setInterval(() => {
        clearTimeout(timeoutId);
        timeoutId = scheduleNextBlink();
      }, 5000); // Ensure new blink is scheduled at least every 5s

      // Return cleanup function
      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        setCurrentLogo("logo");
      };
    };

    return startRandomBlinking();
  }, [step]);

  useEffect(() => {
    // Initialize activation and deactivation sounds
    if (typeof window !== "undefined") {
      activationSound.current = new Audio("/sounds/Data_2.wav")
      activationSound.current.volume = 0.5
      deactivationSound.current = new Audio("/sounds/Data_3.wav")
      deactivationSound.current.volume = 0.5
    }
  }, [])

  const handleMicrophonePermission = () => {
    console.log("Microphone permission granted, enabling Start Test button...")
    setMicPermissionGranted(true)
  }

  const activateMicrophone = async () => {
    try {
      // Reset states first
      setIsListening(false)
      setMicStatus("inactive")
      
      // Request microphone permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      
      // Play activation sound and wait for it to complete
      console.log("Playing activation sound...")
      await playActivationSound()
      
      // Set both states together after sound completes
      console.log("Starting listening...")
      setMicStatus("active")
      setIsListening(true)
      
    } catch (error) {
      console.error('Microphone activation failed:', error)
      setMicStatus("error")
      setIsListening(false)
      await speakText(formatSpeech("I couldn't access the microphone. Please check your microphone permissions and try again."))
    }
  }

  const deactivateMicrophone = async () => {
    // Immediately stop listening
    setIsListening(false)
    setMicStatus("inactive")
    
    // Play deactivation sound
    try {
      await playDeactivationSound()
    } catch (error) {
      console.error('Failed to play deactivation sound:', error)
    }
  }

  const playActivationSound = async () => {
    if (activationSound.current) {
      activationSound.current.currentTime = 0
      try {
        await activationSound.current.play()
        return new Promise(resolve => setTimeout(resolve, 200)) // Wait for sound to complete
      } catch (error) {
        console.warn('Could not play activation sound:', error)
      }
    }
  }

  const playDeactivationSound = async () => {
    if (deactivationSound.current) {
      deactivationSound.current.currentTime = 0
      try {
        await deactivationSound.current.play()
        return new Promise(resolve => setTimeout(resolve, 200)) // Wait for sound to complete
      } catch (error) {
        console.warn('Could not play deactivation sound:', error)
      }
    }
  }

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synth.current) {
        console.warn("Speech synthesis not available")
        resolve()
        return
      }

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
      
      // Add event listener for when speech ends
      utterance.onend = () => {
        console.log("Speech completed:", text)
        // Add a small safety delay after speech ends
        setTimeout(resolve, 500)
      }

      // Also handle errors
      utterance.onerror = () => {
        console.error("Speech synthesis error")
        resolve()
      }
      
      console.log("Starting speech:", text)
      synth.current.speak(utterance)
    })
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

  // Force initial voice loading
  useEffect(() => {
    const initVoice = async () => {
      if (typeof window !== "undefined") {
        synth.current = window.speechSynthesis;
        
        // Force load voices
        let voices = synth.current.getVoices();
        if (voices.length === 0) {
          // Wait for voices to be loaded
          await new Promise(resolve => {
            synth.current?.addEventListener('voiceschanged', resolve, { once: true });
            // Trigger voice load in Chrome
            synth.current?.cancel();
          });
        }
        
        loadVoices();
        
        // Double-check intro wasn't spoken
        if (!hasSpokenIntro.current) {
          setTimeout(() => {
            speakText(formatSpeech("Hi! Ready to check your vision? Just read the letters when they appear, and I'll guide you through the test."));
            hasSpokenIntro.current = true;
          }, 100);
        }
      }
    };

    initVoice();
    
    return () => {
      if (synth.current?.speaking) {
        synth.current.cancel();
      }
    };
  }, []);

  const startTest = () => {
    setStep("distance")
    speakText(formatSpeech("Great! Hold your device at arm's length, about 40 centimeters away. Click continue when ready."))
  }

  const startLetterTest = async () => {
    // First deactivate microphone if it's active
    if (isListening) {
      await deactivateMicrophone()
    }

    // Set initial test state
    setStep("test")
    const newString = generateRandomString(5) // Generate 5 letters
    setCurrentString(newString)
    const level = getCurrentLevel(currentLevelIndex)
    
    // Calculate progress as percentage through all levels
    const progressPercent = (currentLevelIndex / (SNELLEN_LEVELS.length - 1)) * 100
    setProgress(progressPercent)
    
    // Reset attempts for new test
    setWrongAttempts(0)
    setLastTranscript("")
    
    // Update the letter display immediately
    const letterElement = document.getElementById('test-letter')
    if (letterElement) {
      letterElement.style.fontSize = `${level.fontSizePx}px`
      const colors = generateColor(currentLevelIndex)
      letterElement.style.color = colors.text
      letterElement.parentElement?.style.setProperty('background-color', colors.bg)
    }

    // Start test with voice instruction and activate mic right after
    await speakText(formatSpeech("Read these letters"))
    // Activate microphone immediately after instruction
    activateMicrophone()
  }

  const restartTest = () => {
    setStep("intro")
    setCurrentString("")
    setCurrentLevelIndex(0) // Start with largest size
    setResults({
      prescription: SNELLEN_LEVELS[0].ratio,
      lastCorrectIndex: 0
    })
    setProgress(0)
    setLastTranscript("")
    setWrongAttempts(0)
    setMicStatus("inactive")
    if (synth.current && synth.current.speaking) {
      synth.current.cancel()
    }
  }

  const handleVoiceResult = async (transcript: string) => {
    // First deactivate the microphone
    await deactivateMicrophone()
    
    setLastTranscript(transcript.toLowerCase())
    
    // Remove spaces and convert to lowercase for comparison
    const normalizedTranscript = transcript.toLowerCase().replace(/\s+/g, '')
    const normalizedCurrentString = currentString.toLowerCase()
    const isCorrect = normalizedTranscript === normalizedCurrentString
    
    if (isCorrect) {
      // Reset wrong attempts when correct
      setWrongAttempts(0)
      
      // Update results with current level as last correct
      setResults(prev => ({
        ...prev,
        lastCorrectIndex: currentLevelIndex,
        prescription: SNELLEN_LEVELS[currentLevelIndex].ratio
      }))
      
      // Move to next level if not at smallest size
      if (currentLevelIndex < SNELLEN_LEVELS.length - 1) {
        setCurrentLevelIndex(prev => prev + 1)
        await speakText(formatSpeech("Correct"))
        startLetterTest() // This will handle microphone activation
      } else {
        // Reached the best possible vision level (20/20)
        setStep("results")
        // Store results in localStorage
        const accuracy = Math.round((results.lastCorrectIndex + 1) / SNELLEN_LEVELS.length * 100)
        localStorage.setItem('snellenScore', results.prescription)
        localStorage.setItem('snellenAccuracy', `${accuracy}%`)
        await speakText(formatSpeech("Congratulations! You've achieved perfect 20/20 vision!"))
      }
    } else {
      // Increment wrong attempts
      const newWrongAttempts = wrongAttempts + 1
      setWrongAttempts(newWrongAttempts)
      
      if (newWrongAttempts >= 3) {
        // Failed this level after 3 wrong attempts
        setStep("results")
        // Store results in localStorage
        const accuracy = Math.round((results.lastCorrectIndex + 1) / SNELLEN_LEVELS.length * 100)
        localStorage.setItem('snellenScore', results.prescription)
        localStorage.setItem('snellenAccuracy', `${accuracy}%`)
        await speakText(formatSpeech(`Test complete. Your prescription is ${results.prescription}`))
      } else {
        // Still have attempts remaining
        const newString = generateRandomString(5) // Generate new 5 letters
        setCurrentString(newString)
        await speakText(formatSpeech(`Try again`))
        // Activate microphone immediately after feedback
        activateMicrophone()
      }
    }
  }

  // Get current level for display
  const currentLevel = getCurrentLevel(currentLevelIndex)

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100">
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
            {step === "distance" && "Position Device"}
            {step === "test" && "Snellen Test"}
            {step === "results" && "Results"}
          </h1>
          <p className="text-[15px] text-[#666666] leading-relaxed">
            {step === "distance" && "Ensure proper distance for accurate results"}
            {step === "test" && "Speak the letters clearly into your microphone"}
            {step === "results" && "Review your test results"}
          </p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
          {step === "intro" && (
            <Card className="w-full max-w-lg p-6 space-y-6 text-center">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative w-[250px] h-[250px]">
                  <Image
                    src={currentLogo === "logo" ? "/logo.png" : `/${currentLogo}.PNG`}
                    alt="4Sight Logo"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                    className="transition-opacity duration-300"
                  />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter">Welcome to 4Sight</h1>
                <p className="text-muted-foreground">
                  Your personal vision testing assistant. Let's check your vision together.
                </p>
                <MicrophoneSetup onPermissionGranted={handleMicrophonePermission} />
                <Button
                  className="w-full bg-[#6B2FFA] hover:bg-[#5925D9] text-white"
                  onClick={startTest}
                  disabled={!micPermissionGranted}
                >
                  Start Vision Test
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {step === "distance" && (
            <div>
              <div className="px-8 py-10 bg-white">
                <DistanceGuide onDistanceChange={(distance) => {
                  // Enable button only when distance is within 5cm of target (40cm)
                  setIsCorrectDistance(distance !== null && Math.abs(distance - 40) <= 5);
                }} />
              </div>
              <div className="px-8 py-6 bg-[#F5F5F5] flex justify-end">
                <Button
                  onClick={startLetterTest}
                  disabled={!isCorrectDistance}
                  className={`${
                    isCorrectDistance 
                      ? 'bg-[#6B2FFA] hover:bg-[#5925D9]' 
                      : 'bg-gray-400 cursor-not-allowed'
                  } text-white rounded-lg px-4 py-2 text-[14px] font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap`}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Distance Guide - Fixed to viewport */}
          {step === "test" && (
            <div className="fixed top-4 left-4 z-50 w-[280px] bg-[#F5F5F5] rounded-lg overflow-hidden shadow-lg">
              <DistanceGuide compact={true} />
            </div>
          )}

          {step === "test" && (
            <div className="px-8 py-10 bg-white space-y-8">
              <div className="flex justify-between items-center">
                <div 
                  style={{ backgroundColor: generateColor(currentLevelIndex).bg }}
                  className="flex items-center space-x-3 py-2 px-4 rounded-lg"
                >
                  <span className="text-[14px] font-medium" style={{ color: generateColor(currentLevelIndex).text }}>
                    Testing {currentLevel.ratio}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-[14px] font-medium text-[#2C2C2C]">
                    Attempts Remaining: {3 - wrongAttempts}
                  </div>
                  <a 
                    href="/peripheral"
                    className="text-[14px] text-[#6B2FFA] hover:text-[#5925D9] transition-colors"
                  >
                    Try Peripheral Test →
                  </a>
                  <a 
                    href="/gaze-tester"
                    className="text-[14px] text-[#6B2FFA] hover:text-[#5925D9] transition-colors"
                  >
                    Try Gaze Test →
                  </a>
                  {/* Microphone status indicator */}
                  <div className={`flex items-center space-x-2 py-2 px-4 rounded-lg ${
                    micStatus === "active"
                      ? 'bg-[#F3F0FF] text-[#6B2FFA]'
                      : micStatus === "error"
                        ? 'bg-[#FFF4E5] text-[#B76E00]'
                        : 'bg-[#F5F5F5] text-[#2C2C2C]'
                  }`}>
                    <Mic className={`h-4 w-4 ${
                      micStatus === "active" 
                        ? 'animate-bounce' 
                        : micStatus === "error" 
                          ? 'text-[#B76E00]' 
                          : ''
                    }`} />
                    <span className="text-[14px]">
                      {micStatus === "active"
                        ? "Listening..." 
                        : micStatus === "error"
                          ? "Microphone Error"
                          : "Waiting..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Letters Display */}
              <div 
                style={{ backgroundColor: generateColor(currentLevelIndex).bg }}
                className="flex flex-col items-center justify-center min-h-[200px] rounded-lg"
              >
                <p 
                  style={{ 
                    fontSize: `${currentLevel.fontSizePx}px`,
                    color: generateColor(currentLevelIndex).text
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
                  <span className="text-[12px] font-medium" style={{ color: generateColor(currentLevelIndex).text }}>
                    Level {currentLevelIndex + 1} of {SNELLEN_LEVELS.length}
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-1 bg-[#E6E6E6]"
                  indicatorClassName="bg-[#6B2FFA]"
                />
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => setStep("results")}
                    className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium px-6 py-2 rounded-lg transition-colors"
                  >
                    Quit Test
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "results" && (
            <div className="px-8 py-10 bg-white space-y-8">
              <div className="text-center space-y-2">
                <p className="text-[24px] font-semibold text-[#2C2C2C]">
                  Your Prescription: {results.prescription}
                </p>
                <p className="text-[15px] text-[#666666]">
                  You successfully identified letters down to {SNELLEN_LEVELS[results.lastCorrectIndex].ratio} vision
                </p>
              </div>

              <div className="grid gap-4">
                <div className="bg-[#F3F0FF] p-6 rounded-lg space-y-3">
                  <h3 className="text-[14px] font-medium text-[#2C2C2C]">Test Performance</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center">
                      <h3 className="text-sm font-medium mb-4">Reading Accuracy</h3>
                      <div className="text-4xl font-semibold text-[#6B2FFA] dark:text-purple-300 mb-2">
                        {Math.round((results.lastCorrectIndex + 1) / SNELLEN_LEVELS.length * 100)}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Vision Score</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center">
                      <h3 className="text-sm font-medium mb-4">Text Size</h3>
                      <div className="text-4xl font-semibold text-[#6B2FFA] dark:text-purple-300 mb-2">
                        {SNELLEN_LEVELS[results.lastCorrectIndex].fontSizePx}px
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Smallest Read</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F3F0FF] p-6 rounded-lg space-y-3">
                  <h3 className="text-[14px] font-medium text-[#2C2C2C]">Interpretation</h3>
                  <p className="text-[14px] text-[#666666] leading-relaxed">
                    {results.prescription === "20/20"
                      ? "Congratulations! You've achieved perfect 20/20 vision!"
                      : results.prescription === "20/25" || results.prescription === "20/32"
                      ? `Your vision is near normal. You achieved ${results.prescription} vision.`
                      : results.prescription === "20/40" || results.prescription === "20/50"
                      ? `Your vision shows mild impairment. Your prescription is ${results.prescription}.`
                      : results.prescription === "20/63" || results.prescription === "20/80"
                      ? `Your vision shows moderate impairment. Your prescription is ${results.prescription}.`
                      : `Your vision shows significant impairment. Your prescription is ${results.prescription}. We recommend consulting an eye care professional.`
                    }
                  </p>
                </div>

                <div className="bg-[#FFF4E5] p-4 rounded-lg">
                  <p className="text-[12px] text-[#B76E00] text-center">
                    This is not a medical diagnosis. Results may vary based on device screen and testing conditions. Please consult an eye care professional for a comprehensive evaluation.
                  </p>
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