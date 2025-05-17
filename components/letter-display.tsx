"use client"

import { motion } from "framer-motion"

interface LetterDisplayProps {
  letter: string
  size: number
}

export default function LetterDisplay({ letter, size }: LetterDisplayProps) {
  return (
    <div className="flex justify-center items-center h-60">
      <motion.div
        key={`${letter}-${size}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center items-center"
      >
        <span
          style={{
            fontSize: `${size}px`,
            fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 500,
          }}
          className="text-[#1d1d1f]"
        >
          {letter}
        </span>
      </motion.div>
    </div>
  )
}
