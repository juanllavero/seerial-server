import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import FlexBox from '@/components/ui/FlexBox'
import { Slider } from '@/components/ui/slider'
import { useCardWidth } from '@/hooks/useCardWidth'

interface CardWidthSliderProps {
  onWidthChange?: (width: number) => void
}

const CardWidthSlider: React.FC<CardWidthSliderProps> = ({ onWidthChange }) => {
  const { cardWidth, updateCardWidth } = useCardWidth()
  const [localWidth, setLocalWidth] = useState(cardWidth)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideSlider = window.location.pathname === '/home' || window.location.pathname === '/profile'

  useEffect(() => {
    setLocalWidth(cardWidth)
  }, [cardWidth])

  useEffect(() => {
    localStorage.setItem('cardWidth', cardWidth.toString())
    if (onWidthChange) {
      onWidthChange(cardWidth)
    }
  }, [cardWidth, onWidthChange])

  const handleSliderChange = (value: number[]) => {
    const newWidth = value[0]
    setLocalWidth(newWidth)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      updateCardWidth(newWidth)
    }, 500)
  }

  const getPercentage = (width: number): number => {
    return Math.round(((width - 120) / (240 - 120)) * 100)
  }

  if (hideSlider) return null

  return (
    <FlexBox align="center" gap={0.5} justify="center">
      <Slider
        id="cardWidth"
        value={[localWidth]}
        onValueChange={handleSliderChange}
        max={240}
        min={120}
        step={10}
        className="w-20"
      />
      <span className="w-[5ch]">{getPercentage(localWidth)}%</span>
    </FlexBox>
  )
}

export default CardWidthSlider
