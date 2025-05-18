"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export default function DistanceGuide() {
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    setWindowWidth(window.innerWidth)

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate device width in cm (approximate)
  const deviceWidthInCm = windowWidth * 0.0264583333

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-full h-48">
        <Image
          src="/placeholder.svg?height=200&width=300"
          alt="Position your device at arm's length"
          fill
          className="object-contain"
        />
      </div>

      <div className="text-center space-y-2">
        <p className="text-[#1d1d1f] font-medium">Position your device at half an arm's length</p>
        <p className="text-sm text-[#86868b]">
          Hold your device approximately 20 cm (8 inches) from your eyes. This is about half the length of your arm from
          elbow to wrist.
        </p>

        <div className="bg-[#f2f2f7] p-3 rounded-lg mt-4">
          <p className="text-xs text-[#86868b]">
            Your screen is approximately {deviceWidthInCm.toFixed(1)} cm wide. Make sure you're in a well-lit room and
            wearing any corrective lenses you normally use.
          </p>
        </div>
      </div>
    </div>
  )
}
