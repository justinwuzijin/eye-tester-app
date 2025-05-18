'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function GazeInstructionsPage() {
  const startTest = () => {
    window.location.href = '/gaze-tester/index.html';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Logo />
          <a 
            href="/"
            className="text-[14px] text-[#2C2C2C] hover:text-[#6B2FFA] transition-colors"
          >
            Back to Tests
          </a>
        </div>

        {/* Title Section */}
        <div className="space-y-4 mb-8">
          <h1 className="text-[32px] font-semibold text-[#2C2C2C] tracking-tight">
            Gaze Tracking Test Instructions
          </h1>
          <p className="text-[15px] text-[#666666] leading-relaxed">
            Follow these instructions carefully to ensure accurate test results
          </p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
          <div className="px-8 py-10 bg-white">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[15px] text-[#2C2C2C] leading-relaxed">
                  This test will measure how accurately you can follow a moving target with your eyes.
                </p>
                
                <div className="space-y-6">
                  <div className="bg-[#F3F0FF] p-6 rounded-lg space-y-3">
                    <h3 className="text-[14px] font-medium text-[#2C2C2C]">Test Process</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6B2FFA] text-white flex items-center justify-center text-[12px] mt-0.5">1</span>
                        <div className="space-y-1">
                          <p className="text-[14px] font-medium text-[#2C2C2C]">Calibration</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li className="text-[14px] text-[#666666]">Look at each corner of the screen</li>
                            <li className="text-[14px] text-[#666666]">Click each point while looking directly at it</li>
                            <li className="text-[14px] text-[#666666]">The more points you click, the more accurate the tracking</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6B2FFA] text-white flex items-center justify-center text-[12px] mt-0.5">2</span>
                        <div className="space-y-1">
                          <p className="text-[14px] font-medium text-[#2C2C2C]">Start Test</p>
                          <p className="text-[14px] text-[#666666]">After calibration, click the "Start Test" button</p>
                        </div>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6B2FFA] text-white flex items-center justify-center text-[12px] mt-0.5">3</span>
                        <div className="space-y-1">
                          <p className="text-[14px] font-medium text-[#2C2C2C]">During the Test</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li className="text-[14px] text-[#666666]">A purple circle will move in a circular pattern</li>
                            <li className="text-[14px] text-[#666666]">Follow it with your eyes as smoothly as possible</li>
                            <li className="text-[14px] text-[#666666]">Try not to move your head - just your eyes</li>
                            <li className="text-[14px] text-[#666666]">The test will last for 15 seconds</li>
                          </ul>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-[#FFF4E5] p-6 rounded-lg space-y-3">
                    <h3 className="text-[14px] font-medium text-[#B76E00]">Important Requirements</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li className="text-[14px] text-[#B76E00]">Ensure you're in a well-lit room</li>
                      <li className="text-[14px] text-[#B76E00]">Position yourself about arm's length from the screen</li>
                      <li className="text-[14px] text-[#B76E00]">Keep your face centered and visible in the camera feed</li>
                      <li className="text-[14px] text-[#B76E00]">You'll need to allow camera access for the test to work</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-[#F5F5F5] flex justify-end">
            <Button 
              onClick={startTest}
              className="bg-[#6B2FFA] hover:bg-[#5925D9] text-white rounded-lg px-6 py-3 text-[14px] font-medium transition-all duration-200"
            >
              Begin Test <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
} 