import { useServerStore } from '@/context/server.context'
import { authenticatedFetch } from '@/lib/auth'
import { useEffect, useRef, useState } from 'react'

interface GradientBackgroundProps {
  showGradient?: boolean
  imageSrc?: string
  width?: string
  height?: string
  index?: number
}

const GradientBackground = ({
  showGradient = true,
  imageSrc,
  width = '100%',
  height = '100%',
  index = -1,
}: GradientBackgroundProps) => {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const [activeIndex, setActiveIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [gradientCSS, setGradientCSS] = useState<string | undefined>('')
  const canvasRefs = [
    useRef<HTMLCanvasElement | null>(null),
    useRef<HTMLCanvasElement | null>(null),
  ]

  useEffect(() => {
    if (!showGradient || !imageSrc || imageSrc === '') {
      setVisible(false)
    }

    const generateGradient = async () => {
      setVisible(true)

      const response = await authenticatedFetch(
        `${serverUrl}/image-colors?${imageSrc?.startsWith('http') ? `url=${imageSrc}` : `localPath=${imageSrc}`}`,
      )

      const data = await response.json()
      const css = data.css

      const newIndex = (activeIndex + 1) % 2
      setGradientCSS(css)

      const timeout = setTimeout(() => {
        setActiveIndex(newIndex)
      }, 100)

      return () => clearTimeout(timeout)
    }

    generateGradient()
  }, [showGradient, imageSrc])

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: index, width, height }}
    >
      {[0, 1].map((i) => (
        <canvas
          key={i}
          ref={canvasRefs[i]}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${activeIndex === i && showGradient && visible ? 'opacity-100' : 'opacity-0'} `}
          style={{
            width,
            height,
            background: gradientCSS
              ? gradientCSS.replace('background: ', '').replace(';', '')
              : '',
          }}
        />
      ))}
    </div>
  )
}

export default GradientBackground
