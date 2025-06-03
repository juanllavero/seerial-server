import FlexBox from '@/components/ui/FlexBox'
import { Slider } from '@/components/ui/slider'
import { useCardWidth } from '@/hooks/useCardWidth'
import React, { useEffect } from 'react'

interface CardWidthSliderProps {
  onWidthChange?: (width: number) => void
}

const CardWidthSlider: React.FC<CardWidthSliderProps> = ({ onWidthChange }) => {
  const { cardWidth, updateCardWidth } = useCardWidth()

  useEffect(() => {
    localStorage.setItem('cardWidth', cardWidth.toString())
    if (onWidthChange) {
      onWidthChange(cardWidth)
    }
  }, [cardWidth, onWidthChange])

  const handleSliderChange = (value: number[]) => {
    updateCardWidth(value[0])
  }

  // Map the range 120-240 to 0%-100%
  // 120 -> 0%, 200 -> 100%, 240 -> 133%
  const getPercentage = (width: number): number => {
    return Math.round(((width - 120) / (240 - 120)) * 100)
  }

  return (
    <FlexBox align="center" gap={0.5} justify="center">
      <Slider
        id="cardWidth"
        value={[cardWidth]}
        onValueChange={handleSliderChange}
        max={240}
        min={120}
        step={10}
        className="w-20"
      />
      <span className="w-[5ch]">{getPercentage(cardWidth)}%</span>
    </FlexBox>
  )
}

export default CardWidthSlider
