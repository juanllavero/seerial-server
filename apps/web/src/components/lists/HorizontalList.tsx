import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useEffect, useRef, useState, useCallback } from 'react'

interface HorizontalListProps {
  title?: string
  className?: string
  children: React.ReactNode
}

function HorizontalList({ title, className, children }: HorizontalListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showButtons, setShowButtons] = useState(false)
  const [disableLeft, setDisableLeft] = useState(true)
  const [disableRight, setDisableRight] = useState(false)

  const isMobile = useIsMobile()

  const updateButtonState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const isAtStart = container.scrollLeft <= 0
    const isAtEnd =
      container.scrollWidth - container.clientWidth - container.scrollLeft <= 1
    const needsButtons = container.scrollWidth > container.clientWidth

    setShowButtons(needsButtons)
    setDisableLeft(isAtStart)
    setDisableRight(isAtEnd)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateButtonState()

    const resizeObserver = new ResizeObserver(() => {
      updateButtonState()
    })
    resizeObserver.observe(container)
    Array.from(container.children).forEach((child) =>
      resizeObserver.observe(child),
    )

    return () => resizeObserver.disconnect()
  }, [children, updateButtonState])

  const handleScrollRight = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth
    let newScrollLeft = container.scrollLeft + scrollAmount

    if (newScrollLeft > container.scrollWidth - container.clientWidth) {
      newScrollLeft = container.scrollWidth - container.clientWidth
    }

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
  }, [])

  const handleScrollLeft = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth
    let newScrollLeft = container.scrollLeft - scrollAmount

    if (newScrollLeft < 0) {
      newScrollLeft = 0
    }

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
  }, [])

  const handleScrollEvent = () => {
    setTimeout(updateButtonState, 200)
  }

  const gapValue = isMobile ? 1.5 : 0.5
  const paddingValue = '1rem'

  return (
    <FlexBox
      direction="column"
      gap={gapValue}
      width={'100%'}
      className={className}
      padding={isMobile ? '0 1rem' : ''}
    >
      <FlexBox
        justify="space-between"
        align="center"
        width={'100%'}
        padding={`0 ${paddingValue}`}
        height={'3rem'}
      >
        <span className={`text-${isMobile ? 'xl' : '2xl'} font-semibold`}>
          {title}
        </span>
        {showButtons && (
          <FlexBox>
            <Button
              variant={'ghost'}
              onClick={handleScrollLeft}
              disabled={disableLeft}
              aria-label="Scroll Left"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant={'ghost'}
              onClick={handleScrollRight}
              disabled={disableRight}
              aria-label="Scroll Right"
            >
              <ChevronRight />
            </Button>
          </FlexBox>
        )}
      </FlexBox>
      <div
        ref={scrollContainerRef}
        onScroll={handleScrollEvent}
        className="hide-scrollbar" // Asegúrate de que esta clase oculte el scrollbar
        style={{
          display: 'flex',
          gap: `${gapValue}rem`,
          padding: `0 ${paddingValue}`,
          width: '100%',
          overflowX: 'auto',
          // Estas propiedades mejoran la experiencia de scroll en dispositivos táctiles
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        {/* Envolvemos cada hijo para aplicar el snap-align */}
        {React.Children.map(children, (child) => (
          <div style={{ scrollSnapAlign: 'start' }}>{child}</div>
        ))}
      </div>
    </FlexBox>
  )
}

export default HorizontalList
