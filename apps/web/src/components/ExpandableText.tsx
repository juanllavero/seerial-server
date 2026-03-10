import { ChevronDown } from 'lucide-react'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ExpandableTextProps {
  text: string
  className?: string
}

const ExpandableText = ({ text, className = '' }: ExpandableTextProps) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isClamped, setIsClamped] = useState(true)
  const [showButton, setShowButton] = useState(false)
  const [fullHeight, setFullHeight] = useState(0)
  const textRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const checkTruncation = () => {
      if (hiddenRef.current && textRef.current) {
        const hiddenHeight = hiddenRef.current.scrollHeight
        const maxHeight = 72
        setFullHeight(hiddenHeight)
        setShowButton(hiddenHeight > maxHeight)
      }
    }
    checkTruncation()
    window.addEventListener('resize', checkTruncation)
    return () => window.removeEventListener('resize', checkTruncation)
  }, [])

  useEffect(() => {
    if (isExpanded) {
      setIsClamped(false)
    } else {
      const timer = setTimeout(() => {
        setIsClamped(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isExpanded])

  return (
    <div className={`relative ${className}`}>
      <div ref={hiddenRef} className="invisible absolute -z-10 w-full">
        <div className="text-pretty">{text}</div>
      </div>

      <div
        ref={textRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? `${fullHeight}px` : '72px' }}
      >
        <div className={`text-pretty ${isClamped ? 'line-clamp-3' : ''}`}>{text}</div>
      </div>

      {showButton && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 ml-auto flex w-full items-center text-sm"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span
            className="font-semibold"
            style={{ color: isHovered ? 'white' : 'var(--app-color)' }}
          >
            {isExpanded ? t('lessButton') : t('moreButton')}
          </span>
          <ChevronDown
            className={`ml-1 h-5 w-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
            style={{ color: isHovered ? 'white' : 'var(--app-color)' }}
          />
        </button>
      )}
    </div>
  )
}

export default memo(ExpandableText)
