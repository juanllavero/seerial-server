import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface HorizontalListProps {
  title?: string
  children: React.ReactNode
}

function HorizontalList({ title, children }: HorizontalListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showButtons, setShowButtons] = useState(false)
  const [disableLeft, setDisableLeft] = useState(true)
  const [disableRight, setDisableRight] = useState(false)

  const isMobile = useIsMobile()

  const updateButtonVisibility = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      setShowButtons(container.scrollWidth > container.clientWidth)
      setDisableLeft(container.scrollLeft === 0)
      setDisableRight(
        container.scrollWidth - container.clientWidth === container.scrollLeft,
      )
    }
  }

  useEffect(() => {
    updateButtonVisibility()

    const handleResize = () => {
      updateButtonVisibility()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [children])

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      setDisableLeft(container.scrollLeft === 0)
      setDisableRight(
        container.scrollWidth - container.clientWidth === container.scrollLeft,
      )
    }
  }

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft -= 1200
      handleScroll()
    }
  }

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += 1200
      handleScroll()
    }
  }

  return (
    <FlexBox direction="column" gap={isMobile ? 1.5 : 0.5} width={'100%'}>
      <FlexBox
        justify="space-between"
        gap={1}
        padding="0 0.5rem"
        width={'100%'}
        height={'3rem'}
      >
        <span className="text-xl font-semibold">{title}</span>
        {showButtons && (
          <FlexBox gap={0.5}>
            <Button
              variant={'ghost'}
              onClick={handleScrollLeft}
              disabled={disableLeft}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant={'ghost'}
              onClick={handleScrollRight}
              disabled={disableRight}
            >
              <ChevronRight />
            </Button>
          </FlexBox>
        )}
      </FlexBox>
      <FlexBox
        ref={scrollContainerRef}
        gap={1}
        width={'100%'}
        padding="0 1rem"
        scroll="horizontal"
        hideScrollbar
        onScroll={handleScroll}
      >
        {children}
      </FlexBox>
    </FlexBox>
  )
}

export default HorizontalList
