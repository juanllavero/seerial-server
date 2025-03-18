import React, { useEffect, useState } from 'react'
import FloatingBox from './FloatingBox'

export default function DragWindowRegion() {
  const [isWindows, setIsWindows] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Windows')) {
      setIsWindows(true)
    }
  }, [])

  return (
    <div className="absolute top-0 z-100 flex w-screen items-stretch justify-start align-top">
      <FloatingBox isWindows={isWindows} />
    </div>
  )
}
