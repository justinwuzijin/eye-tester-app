"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, Eye, Target, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/Logo';

export default function ResultsPage() {
  const [results, setResults] = useState({
    snellen: { score: '20/20', accuracy: '0%' },
    peripheral: { score: '0%' },
    gazeTracker: { accuracy: '0%', reactionTime: '0.0s' }
  });
  
  const router = useRouter();
  const synth = useRef<SpeechSynthesis | null>(null);
  const defaultVoice = useRef<SpeechSynthesisVoice | null>(null);
  const hasSpokenIntro = useRef(false);

  // Load and set the voice
  const loadVoices = () => {
    const voices = synth.current?.getVoices() || [];
    const preferredVoices = [
      "Microsoft Aria Online (Natural)",
      "Microsoft Guy Online (Natural)",
      "Google UK English Male",
      "Google UK English Female",
      "Karen",
      "Daniel",
      "Moira",
      "Samantha",
      "Microsoft David",
      "Microsoft Mark",
      "Microsoft Zira",
      "en-US",
      "en-GB",
      "en"
    ];
    
    for (const preferredVoice of preferredVoices) {
      const voice = voices.find(v => 
        v.name.includes(preferredVoice) || 
        v.lang.startsWith(preferredVoice)
      );
      
      if (voice) {
        defaultVoice.current = voice;
        break;
      }
    }

    if (!hasSpokenIntro.current) {
      setTimeout(() => {
        speakText(formatSpeech("Welcome to your comprehensive vision analysis! Here are your results from all three tests."));
        hasSpokenIntro.current = true;
      }, 1000);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      synth.current = window.speechSynthesis;
      
      if (synth.current?.addEventListener) {
        synth.current.addEventListener('voiceschanged', loadVoices);
      }
      
      loadVoices();

      // Get all test results from localStorage
      const snellenScore = localStorage.getItem('snellenScore') || '20/20';
      const snellenAccuracy = localStorage.getItem('snellenAccuracy') || '0%';
      const peripheralAccuracy = localStorage.getItem('peripheralAccuracy') || '0%';
      const gazeAccuracy = localStorage.getItem('gazeAccuracy') || '0%';
      const reactionTime = localStorage.getItem('reactionTime') || '0.0s';
      
      setResults({
        snellen: { 
          score: snellenScore,
          accuracy: snellenAccuracy
        },
        peripheral: { 
          score: peripheralAccuracy
        },
        gazeTracker: {
          accuracy: gazeAccuracy,
          reactionTime: reactionTime
        }
      });
    }

    return () => {
      if (synth.current?.speaking) {
        synth.current.cancel();
      }
      if (synth.current?.removeEventListener) {
        synth.current.removeEventListener('voiceschanged', loadVoices);
      }
    };
  }, []);

  const formatSpeech = (text: string) => {
    return text.replace(/([.!?]) /g, '$1, ')
              .replace(/(\d+)/g, ' $1 ')
              .replace(/([,]) /g, '$1 ');
  };

  const speakText = (text: string) => {
    if (synth.current) {
      if (synth.current.speaking) {
        synth.current.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (defaultVoice.current) {
        utterance.voice = defaultVoice.current;
      }
      
      utterance.rate = 1.25;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;
      
      synth.current.speak(utterance);
    }
  };

  const speakResults = () => {
    const message = `
      Here are your comprehensive vision test results:
      For the Snellen vision test, your score was ${results.snellen.score} with ${results.snellen.accuracy} accuracy.
      In the peripheral vision test, you achieved ${results.peripheral.score} accuracy.
      Your gaze tracking test showed ${results.gazeTracker.accuracy} accuracy with a reaction time of ${results.gazeTracker.reactionTime}.
    `;
    
    speakText(formatSpeech(message));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#FAFAFA] dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-12">
            <Logo />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-4">
            Final Results Analysis
          </h1>
          <p className="text-[0.9375rem] text-gray-600 dark:text-gray-400 mb-8">
            Comprehensive analysis of your vision test performance across all tests
          </p>
          <nav className="flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 text-sm font-medium bg-white dark:bg-gray-800 border border-[#6B2FFA] dark:border-purple-300 text-[#6B2FFA] dark:text-purple-300 rounded-lg hover:bg-[#F3F0FF] dark:hover:bg-gray-700 transition-colors"
            >
              Return to Home
            </button>
          </nav>
        </header>

        <section className="max-w-2xl mx-auto mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium">Test Results Summary</h2>
              <button
                onClick={speakResults}
                className="flex items-center space-x-2 text-[14px] text-[#6B2FFA] hover:text-[#5925D9] dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
                aria-label="Read results aloud"
              >
                <Volume2 className="h-4 w-4" />
                <span>Read Results</span>
              </button>
            </div>
            
            <div className="grid gap-6">
              {/* Snellen Test Results */}
              <div className="bg-[#F3F0FF] dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="h-5 w-5 text-[#6B2FFA] dark:text-purple-300" />
                  <h3 className="text-lg font-medium">Snellen Vision Test</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vision Score</p>
                    <p className="text-2xl font-semibold text-[#6B2FFA] dark:text-purple-300">
                      {results.snellen.score}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accuracy</p>
                    <p className="text-2xl font-semibold text-[#6B2FFA] dark:text-purple-300">
                      {results.snellen.accuracy}
                    </p>
                  </div>
                </div>
              </div>

              {/* Peripheral Vision Test Results */}
              <div className="bg-[#F3F0FF] dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-5 w-5 text-[#6B2FFA] dark:text-purple-300" />
                  <h3 className="text-lg font-medium">Peripheral Vision Test</h3>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accuracy</p>
                  <p className="text-2xl font-semibold text-[#6B2FFA] dark:text-purple-300">
                    {results.peripheral.score}
                  </p>
                </div>
              </div>

              {/* Gaze Tracking Test Results */}
              <div className="bg-[#F3F0FF] dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Crosshair className="h-5 w-5 text-[#6B2FFA] dark:text-purple-300" />
                  <h3 className="text-lg font-medium">Gaze Tracking Test</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accuracy</p>
                    <p className="text-2xl font-semibold text-[#6B2FFA] dark:text-purple-300">
                      {results.gazeTracker.accuracy}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reaction Time</p>
                    <p className="text-2xl font-semibold text-[#6B2FFA] dark:text-purple-300">
                      {results.gazeTracker.reactionTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-[#E6E6E6] dark:border-gray-600">
              <div className="bg-[#FFF4E5] p-4 rounded-lg mb-6">
                <p className="text-[12px] text-[#B76E00] text-center">
                  This is not a medical diagnosis. Results may vary based on device screen, lighting conditions, and individual factors. Please consult an eye care professional for a comprehensive evaluation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 