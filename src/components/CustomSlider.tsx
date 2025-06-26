import React, { useCallback, useEffect, useRef, useState } from 'react'

interface SliderProps {
  value: number
  buffered: number
  onChange: (value: number) => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
  className?: string
}

const CustomSlider: React.FC<SliderProps> = ({
  value,
  buffered,
  onChange,
  onInteractionStart,
  onInteractionEnd,
  className = '',
}) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extended area to improve accessibility (in pixels)
  const EXTENDED_AREA = 50

  const calculateValue = useCallback((clientX: number) => {
    if (!sliderRef.current) return 0

    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    return percentage
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      onInteractionStart?.()
      const newValue = calculateValue(e.clientX)
      setTempValue(newValue)
      onChange(newValue)
    },
    [calculateValue, onChange, onInteractionStart],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const newValue = calculateValue(e.clientX)
      setTempValue(newValue)
      onChange(newValue)
    },
    [isDragging, calculateValue, onChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    onInteractionEnd?.()
  }, [onInteractionEnd])

  const checkIfInExtendedArea = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !sliderRef.current) return false

      const containerRect = containerRef.current.getBoundingClientRect()
      const sliderRect = sliderRef.current.getBoundingClientRect()

      return (
        clientY >= containerRect.top - EXTENDED_AREA &&
        clientY <= containerRect.bottom + EXTENDED_AREA &&
        clientX >= sliderRect.left &&
        clientX <= sliderRect.right
      )
    },
    [],
  )

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return

      const isInArea = checkIfInExtendedArea(e.clientX, e.clientY)
      if (!isInArea) {
        setIsHovering(false)
      }
    },
    [isDragging, checkIfInExtendedArea],
  )

  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const isInArea = checkIfInExtendedArea(e.clientX, e.clientY)

      // Only change over state if not dragging
      if (!isDragging) {
        setIsHovering(isInArea)
      }

      //Update value if it is dragging and in extended area
      if (isDragging && isInArea) {
        const newValue = calculateValue(e.clientX)
        setTempValue(newValue)
        onChange(newValue)
      }
    },
    [isDragging, calculateValue, onChange, checkIfInExtendedArea],
  )

  // Event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Clean hover state when drag is finished
  useEffect(() => {
    if (!isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const isInArea = checkIfInExtendedArea(e.clientX, e.clientY)
        setIsHovering(isInArea)
        document.removeEventListener('mousemove', handleGlobalMouseMove)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)

      // Clean if no movement is detected
      const timeout = setTimeout(() => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
      }, 100)

      return () => {
        clearTimeout(timeout)
        document.removeEventListener('mousemove', handleGlobalMouseMove)
      }
    }
  }, [isDragging, checkIfInExtendedArea])

  // Sync tempValue and value when not dragging
  useEffect(() => {
    if (!isDragging) {
      setTempValue(value)
    }
  }, [value, isDragging])

  const currentValue = isDragging ? tempValue : value

  return (
    <div
      ref={containerRef}
      className={`relative w-full cursor-pointer py-2 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleContainerMouseMove}
      onMouseDown={handleMouseDown}
    >
      {/* Slider Bar */}
      <div
        ref={sliderRef}
        className={`bg-opacity-50 relative rounded-full bg-gray-600 transition-all duration-200 ${
          isHovering || isDragging ? 'h-1' : 'h-0.5'
        }`}
      >
        {/* Buffer Progress */}
        <div
          className="bg-opacity-60 absolute top-0 left-0 h-full rounded-full bg-gray-400 transition-all duration-200"
          style={{ width: `${Math.min(buffered, 100)}%` }}
        />

        {/* Current Progress */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-red-600 transition-all duration-200"
          style={{ width: `${Math.min(currentValue, 100)}%` }}
        />

        {/* Circle */}
        {(isHovering || isDragging) && (
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 transform rounded-full bg-white shadow-lg transition-all duration-200"
            style={{
              left: `calc(${Math.min(currentValue, 100)}% - 6px)`,
            }}
          />
        )}
      </div>
    </div>
  )
}

export default CustomSlider
