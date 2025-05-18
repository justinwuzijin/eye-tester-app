"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2 } from 'lucide-react';

export default function GazeResultsPage() {
  const [gazeAccuracy, setGazeAccuracy] = useState('95%');
  const [reactionTime, setReactionTime] = useState('0.5s');
  const router = useRouter();
  const synth = useRef<SpeechSynthesis | null>(null);
  const defaultVoice = useRef<SpeechSynthesisVoice | null>(null);
  const hasSpokenIntro = useRef(false);

  // Load and set the voice
  const loadVoices = () => {
    const voices = synth.current?.getVoices() || [];
    console.log("Available voices:", voices.map(v => ({ name: v.name, lang: v.lang })));
    
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
        console.log("Selected voice:", voice.name);
        defaultVoice.current = voice;
        break;
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      synth.current = window.speechSynthesis;
      
      if (synth.current?.addEventListener) {
        synth.current.addEventListener('voiceschanged', loadVoices);
      }
      
      loadVoices();

      // Get results from localStorage
      const storedGazeAccuracy = localStorage.getItem('gazeAccuracy');
      const storedReactionTime = localStorage.getItem('reactionTime');
      
      if (storedGazeAccuracy) {
        setGazeAccuracy(storedGazeAccuracy);
      }
      if (storedReactionTime) {
        setReactionTime(storedReactionTime);
      }


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
    const accuracyMessage = `Your gaze tracking accuracy is ${gazeAccuracy}, `;
    const reactionMessage = `and your average reaction time is ${reactionTime}. `;
    
    let recommendationMessage = "";
    const accuracyNum = parseInt(gazeAccuracy);
    const reactionNum = parseFloat(reactionTime);
    
    if (accuracyNum >= 90 && reactionNum <= 0.6) {
      recommendationMessage = "Your eye tracking capabilities are excellent! Your gaze control and reaction time are well above average.";
    } else if (accuracyNum >= 70 && reactionNum <= 1.0) {
      recommendationMessage = "Your eye tracking performance is good, but there's room for improvement. Regular practice can help enhance your gaze control.";
    } else {
      recommendationMessage = "Consider practicing more with eye-tracking exercises to improve your gaze control and reaction time.";
    }

    speakText(formatSpeech(`${accuracyMessage}${reactionMessage}${recommendationMessage}`));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-3 h-3 bg-[#6B2FFA] rounded-sm"></div>
            <span className="text-[0.9375rem] font-medium">4Sight</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-4">
            Gaze Tracking Analysis
          </h1>
          <p className="text-[0.9375rem] text-gray-600 dark:text-gray-400 mb-8">
            A detailed analysis of your eye tracking performance and capabilities
          </p>
          <nav className="flex gap-4">
            <button 
              onClick={() => document.getElementById('test-results')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 text-sm font-medium bg-[#F3F0FF] dark:bg-gray-700 text-[#6B2FFA] dark:text-purple-300 rounded-lg hover:bg-[#E6E0FF] dark:hover:bg-gray-600 transition-colors"
              aria-label="View test results"
            >
              Test Results
            </button>
            <button
              onClick={() => document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 text-sm font-medium bg-[#F3F0FF] dark:bg-gray-700 text-[#6B2FFA] dark:text-purple-300 rounded-lg hover:bg-[#E6E0FF] dark:hover:bg-gray-600 transition-colors"
              aria-label="View recommendations"
            >
              Recommendations
            </button>
            <button
              onClick={() => router.push('/gaze-tester')}
              className="px-6 py-3 text-sm font-medium bg-white dark:bg-gray-800 border border-[#6B2FFA] dark:border-purple-300 text-[#6B2FFA] dark:text-purple-300 rounded-lg hover:bg-[#F3F0FF] dark:hover:bg-gray-700 transition-colors"
              aria-label="Return to test"
            >
              Return to Test
            </button>
          </nav>
        </header>

        <section id="test-results" className="max-w-2xl mx-auto mb-12 px-6">
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
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#F3F0FF] dark:bg-gray-700 rounded-lg p-6 text-center">
                <h3 className="text-sm font-medium mb-4">Gaze Accuracy</h3>
                <div className="text-4xl font-semibold text-[#6B2FFA] dark:text-purple-300 mb-2">
                  {gazeAccuracy}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tracking Precision</p>
              </div>
              <div className="bg-[#F3F0FF] dark:bg-gray-700 rounded-lg p-6 text-center">
                <h3 className="text-sm font-medium mb-4">Average Reaction Time</h3>
                <div className="text-4xl font-semibold text-[#6B2FFA] dark:text-purple-300 mb-2">
                  {reactionTime}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Response Speed</p>
              </div>
            </div>
          </div>
        </section>

        <section id="interpretation" className="max-w-2xl mx-auto mb-12 px-6">
          <div className="grid gap-4">
            <div className="bg-[#F3F0FF] p-6 rounded-lg space-y-3">
              <h3 className="text-[14px] font-medium text-[#2C2C2C]">Interpretation</h3>
              <p className="text-[14px] text-[#666666] leading-relaxed">
                {parseInt(gazeAccuracy) >= 90 && parseFloat(reactionTime) <= 0.6
                  ? "Your eye tracking capabilities are excellent! Your gaze control and reaction time are well above average."
                  : parseInt(gazeAccuracy) >= 70 && parseFloat(reactionTime) <= 1.0
                  ? "Your eye tracking performance is good, but there's room for improvement. Regular practice can help enhance your gaze control."
                  : "Consider practicing more with eye-tracking exercises to improve your gaze control and reaction time. Regular practice will help enhance your performance."
                }
              </p>
            </div>

            <div className="bg-[#FFF4E5] p-4 rounded-lg">
              <p className="text-[12px] text-[#B76E00] text-center">
                This is not a medical diagnosis. Results may vary based on device screen, lighting conditions, and individual factors. Please consult an eye care professional for a comprehensive evaluation.
              </p>
            </div>
          </div>
        </section>

        <section id="recommendations" className="max-w-2xl mx-auto mb-12 px-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-medium mb-6">Improvement Recommendations</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  name: "Eye Exercises",
                  info: "Regular eye movement exercises to improve gaze control and tracking ability.",
                  duration: "10-15 mins daily",
                  icon: "👁️"
                },
                {
                  name: "Screen Breaks",
                  info: "Take regular breaks to reduce eye strain and maintain optimal tracking performance.",
                  duration: "Every 20 mins",
                  icon: "⏲️"
                },
                {
                  name: "Focus Practice",
                  info: "Practice switching focus between near and far objects to enhance eye control.",
                  duration: "5 mins, 3x daily",
                  icon: "🎯"
                },
                {
                  name: "Tracking Games",
                  info: "Play eye-tracking games to improve accuracy and reaction time in a fun way.",
                  duration: "15-20 mins daily",
                  icon: "🎮"
                }
              ].map((recommendation, index) => (
                <div 
                  key={recommendation.name}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 transition-transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="text-2xl mb-3">{recommendation.icon}</div>
                  <h3 className="font-medium mb-2">{recommendation.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{recommendation.info}</p>
                  <p className="text-sm font-medium text-[#6B2FFA] dark:text-purple-300">
                    {recommendation.duration}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 