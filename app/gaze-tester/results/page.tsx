"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/Logo';

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
            <Logo />
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
              {(() => {
                const accuracyNum = parseInt(gazeAccuracy);
                const reactionNum = parseFloat(reactionTime);
                
                // Helper function to get reaction time assessment
                const getReactionAssessment = (time: number) => {
                  if (time <= 0.3) return "exceptional";
                  if (time <= 0.5) return "excellent";
                  if (time <= 0.8) return "good";
                  if (time <= 1.0) return "average";
                  return "below average";
                };

                // Helper function to get accuracy assessment
                const getAccuracyAssessment = (score: number) => {
                  if (score >= 95) return "exceptional";
                  if (score >= 90) return "excellent";
                  if (score >= 85) return "very good";
                  if (score >= 80) return "good";
                  if (score >= 75) return "fair";
                  return "needs improvement";
                };

                const accuracyAssessment = getAccuracyAssessment(accuracyNum);
                const reactionAssessment = getReactionAssessment(reactionNum);

                return (
                  <div className="space-y-4">
                    <p className="text-[14px] text-[#666666] leading-relaxed">
                      {accuracyNum >= 90 && reactionNum <= 0.5 ? (
                        <>
                          <strong className="text-[#6B2FFA]">Outstanding Performance!</strong> Your eye tracking capabilities are exceptional. 
                          With {accuracyNum}% accuracy and a {reactionNum}s reaction time, you demonstrate excellent control and responsiveness. 
                          This level of performance is ideal for precision tasks and advanced eye-tracking applications.
                        </>
                      ) : accuracyNum >= 80 && reactionNum <= 0.8 ? (
                        <>
                          <strong className="text-[#6B2FFA]">Very Good Performance!</strong> Your eye tracking shows strong capabilities. 
                          Your {accuracyNum}% accuracy is impressive, and your {reactionNum}s reaction time is well within normal ranges. 
                          With some practice, you could achieve even better results.
                        </>
                      ) : accuracyNum >= 65 ? (
                        <>
                          <strong className="text-[#6B2FFA]">Good Performance</strong> Your eye tracking shows normal results. 
                          With {accuracyNum}% accuracy and {reactionNum}s reaction time, you're demonstrating typical eye tracking ability. 
                          Regular practice could help enhance both your accuracy and speed if you'd like to improve further.
                        </>
                      ) : accuracyNum >= 50 ? (
                        <>
                          <strong className="text-[#6B2FFA]">Normal Performance</strong> Your eye tracking is within normal ranges. 
                          While your {accuracyNum}% accuracy shows room for improvement, this is a common score for many people. 
                          If you'd like to enhance your performance, try the suggested exercises below.
                        </>
                      ) : (
                        <>
                          <strong className="text-[#FF4444]">Below Expected Range</strong> Your eye tracking performance ({accuracyNum}% accuracy) 
                          is below typical ranges. This could be due to various factors like:
                          <ul className="list-disc ml-4 mt-2 mb-2 text-[#666666]">
                            <li>Lighting conditions</li>
                            <li>Screen position or distance</li>
                            <li>Camera calibration issues</li>
                            <li>Potential vision-related factors</li>
                          </ul>
                          Consider trying the test again with good lighting and proper positioning. If scores remain low, a vision check might be helpful.
                        </>
                      )}
                    </p>
                    <div className="text-[13px] text-[#666666] pt-2 border-t border-purple-100">
                      <p className="mb-2">
                        <strong className="text-[#2C2C2C]">Accuracy Assessment:</strong> Your gaze accuracy is {accuracyAssessment} 
                         ({accuracyNum}%). {accuracyNum >= 80 ? "This shows excellent eye control!" : 
                          accuracyNum >= 65 ? "This is a good, typical result." : 
                          accuracyNum >= 50 ? "This is within normal ranges." :
                          "Try adjusting your setup and retaking the test."}
                      </p>
                      <p>
                        <strong className="text-[#2C2C2C]">Reaction Time Assessment:</strong> Your response time is {reactionAssessment} 
                         ({reactionTime}). {reactionNum <= 0.5 ? "This is remarkably fast!" : 
                          reactionNum <= 0.8 ? "This shows good responsiveness." : 
                          reactionNum <= 1.2 ? "This is a typical response time." :
                          "Consider retaking the test to improve this score."}
                      </p>
                      {(accuracyNum < 50 || reactionNum > 1.5) && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700">
                          <strong>Suggestions for Improvement:</strong>
                          <ul className="list-disc ml-4 mt-2 space-y-1">
                            <li>Ensure you're in a well-lit room</li>
                            <li>Position yourself 40-50cm from the screen</li>
                            <li>Take breaks if your eyes feel tired</li>
                            <li>Consider a routine vision check if scores consistently remain low</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-[#FFF4E5] p-4 rounded-lg">
              <p className="text-[12px] text-[#B76E00] text-center">
                This is not a medical diagnosis. Results may vary based on device screen, lighting conditions, and individual factors. Please consult an eye care professional for a comprehensive evaluation.
              </p>
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
                    localStorage.setItem('gazeAccuracy', gazeAccuracy);
                    localStorage.setItem('reactionTime', reactionTime);
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
        </section>
      </div>
    </div>
  );
} 