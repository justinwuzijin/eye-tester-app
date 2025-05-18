import Image from 'next/image'

interface LogoProps {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="relative w-[50px] h-[50px]">
        <Image
          src="/logo.png"
          alt="4Sight Logo"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
      <h2 className="text-[22px] font-medium text-[#2C2C2C] dark:text-gray-200">4Sight</h2>
    </div>
  )
} 