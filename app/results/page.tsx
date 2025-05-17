"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResultsPage() {
  const [snellenScore, setSnellenScore] = useState('20/20');
  const [peripheralAccuracy, setPeripheralAccuracy] = useState('100%');
  const router = useRouter();

  useEffect(() => {
    // Get results from localStorage
    const storedSnellenScore = localStorage.getItem('snellenScore');
    const storedPeripheralAccuracy = localStorage.getItem('peripheralAccuracy');
    
    if (storedSnellenScore) {
      setSnellenScore(storedSnellenScore);
    }
    if (storedPeripheralAccuracy) {
      setPeripheralAccuracy(storedPeripheralAccuracy);
    }
  }, []);

  return (
    <div className="container min-h-screen bg-gradient-to-b from-white to-[#FAFAFA] dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      <header className="max-w-2xl mx-auto mb-12 px-6 pt-16">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-3 h-3 bg-[#6B2FFA] rounded-sm"></div>
          <span className="text-[0.9375rem] font-medium">4Sight</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">
          Detailed Vision Analysis
        </h1>
        <p className="text-[0.9375rem] text-gray-600 dark:text-gray-400 mb-8">
          A comprehensive breakdown of your vision test results and recommendations
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
            onClick={() => document.getElementById('treatments')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 text-sm font-medium bg-[#F3F0FF] dark:bg-gray-700 text-[#6B2FFA] dark:text-purple-300 rounded-lg hover:bg-[#E6E0FF] dark:hover:bg-gray-600 transition-colors"
            aria-label="View treatment options"
          >
            Treatment Options
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 text-sm font-medium bg-white dark:bg-gray-800 border border-[#6B2FFA] dark:border-purple-300 text-[#6B2FFA] dark:text-purple-300 rounded-lg hover:bg-[#F3F0FF] dark:hover:bg-gray-700 transition-colors"
            aria-label="Return to tests"
          >
            Return to Tests
          </button>
        </nav>
      </header>

      <section id="test-results" className="max-w-2xl mx-auto mb-12 px-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-medium mb-6">Test Results Summary</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#F3F0FF] dark:bg-gray-700 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium mb-4">Snellen Test Results</h3>
              <div className="text-4xl font-semibold text-[#6B2FFA] dark:text-purple-300 mb-2">
                {snellenScore}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Visual Acuity</p>
            </div>
            <div className="bg-[#F3F0FF] dark:bg-gray-700 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium mb-4">Peripheral Vision Results</h3>
              <div className="text-4xl font-semibold text-[#6B2FFA] dark:text-purple-300 mb-2">
                {peripheralAccuracy}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Peripheral Vision Accuracy</p>
            </div>
          </div>
        </div>
      </section>

      <section id="treatments" className="max-w-2xl mx-auto mb-12 px-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-medium mb-6">Recommended Treatments</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: "Glasses",
                info: "Prescription lenses that correct refractive errors such as myopia, hyperopia, and astigmatism.",
                cost: "$200 - $350",
                icon: "👓"
              },
              {
                name: "Contact Lenses",
                info: "Soft or rigid lenses worn directly on the eye to correct vision.",
                cost: "$1000",
                icon: "👁️"
              },
              {
                name: "Better eye practices",
                info: "Take a 20-second break every 20 minutes and look at something 20 feet away.",
                cost: "$0",
                icon: "⏲️"
              },
              {
                name: "LASIK Eye Surgery",
                info: "Corrects hyperopia and myopia. A laser surgical procedure that permanently reshapes the cornea.",
                cost: "$1500 to $3500 per eye",
                icon: "⚡"
              }
            ].map((treatment, index) => (
              <div 
                key={treatment.name}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 transition-transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="text-3xl mb-4" aria-hidden="true">{treatment.icon}</div>
                <h3 className="text-sm font-medium mb-3">{treatment.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{treatment.info}</p>
                <p className="text-sm font-medium text-[#6B2FFA] dark:text-purple-300">
                  Cost: {treatment.cost}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 