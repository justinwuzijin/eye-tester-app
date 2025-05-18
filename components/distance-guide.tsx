"use client"

import { useState, useEffect, useRef } from "react"
import * as faceapi from 'face-api.js'

export default function DistanceGuide() {
  const [windowWidth, setWindowWidth] = useState(0)
  const [distance, setDistance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setWindowWidth(window.innerWidth)

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Load face detection models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading face detection models:", err)
      }
    }

    loadModels()
  }, [])

  useEffect(() => {
    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          }
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream

          // Wait for video to be ready
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = resolve
            }
          })

          // Start face detection once video is playing
          startFaceDetection()
        }
      } catch (err) {
        console.error("Error accessing webcam:", err)
      }
    }

    if (!isLoading) {
      setupWebcam()
    }

    // Cleanup function to stop the webcam when component unmounts
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isLoading])

  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Match canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Function to estimate distance based on face size
    const estimateDistance = (faceWidth: number) => {
      // These values need to be calibrated for your specific camera
      const FACE_WIDTH_CM = 16 // average human face width
      const FOCAL_LENGTH = 615 // focal length in pixels (needs calibration)
      
      // Distance = (FACE_WIDTH_CM * FOCAL_LENGTH) / faceWidth
      return (FACE_WIDTH_CM * FOCAL_LENGTH) / faceWidth
    }

    const detectFace = async () => {
      if (video.paused || video.ended) return

      const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions()
      )

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (detection) {
        // Calculate distance
        const faceWidth = detection.box.width
        const estimatedDistance = estimateDistance(faceWidth)
        setDistance(estimatedDistance)

        // Draw face box
        ctx.strokeStyle = '#6B2FFA'
        ctx.lineWidth = 2
        ctx.strokeRect(
          detection.box.x,
          detection.box.y,
          detection.box.width,
          detection.box.height
        )
      } else {
        setDistance(null)
      }

      // Request next frame
      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  // Calculate device width in cm (approximate)
  const deviceWidthInCm = windowWidth * 0.0264583333

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-64 h-64">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-2xl transform scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full transform scale-x-[-1] pointer-events-none rounded-2xl"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl">
            <div className="text-white">Loading face detection...</div>
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <p className="text-[#1d1d1f] font-medium">Position your device at arm's length</p>
        <p className="text-sm text-[#86868b]">
          Hold your device approximately 40 centimeters (16 inches) from your eyes. This is about the length of your arm from
          elbow to wrist.
        </p>

        {distance !== null && (
          <div className={`bg-[#F3F0FF] p-3 rounded-lg ${
            Math.abs(distance - 40) <= 5 ? 'bg-[#F0FFF4] text-[#0E9F6E]' : ''
          }`}>
            <p className="text-sm font-medium">
              {Math.abs(distance - 40) <= 5 
                ? "Perfect distance! ✓"
                : distance < 40 
                  ? "Move your device further away ↔"
                  : "Move your device closer ↔"
              }
            </p>
            <p className="text-xs mt-1">
              Current distance: ~{Math.round(distance)}cm
            </p>
          </div>
        )}

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
