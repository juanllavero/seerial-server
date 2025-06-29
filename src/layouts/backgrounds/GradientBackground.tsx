import useMusicStore from '@/context/music.context'
import { ReactUtils } from '@/utils/ReactUtils'
import { useEffect, useRef, useState } from 'react'

interface GradientBackgroundProps {
  showGradient?: boolean
  width?: string
  height?: string
  isSong?: boolean
}

const GradientBackground = ({
  showGradient = true,
  width = '100%',
  height = '100%',
  isSong = false,
}: GradientBackgroundProps) => {
  const { isExpanded } = useMusicStore()
  const [activeIndex, setActiveIndex] = useState(0)
  const canvasRefs = [
    useRef<HTMLCanvasElement | null>(null),
    useRef<HTMLCanvasElement | null>(null),
  ]

  const drawGradient = (canvas: HTMLCanvasElement, colors: string[]) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const gradients = [
      { x: 0, y: canvas.height, color: colors[0] },
      { x: canvas.width, y: canvas.height, color: colors[1] },
      { x: canvas.width, y: 0, color: colors[2] },
      { x: 0, y: 0, color: colors[3] },
    ]

    gradients.forEach(({ x, y, color }) => {
      const gradient = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        Math.max(canvas.width, canvas.height),
      )
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    })

    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'source-over'
  }

  useEffect(() => {
    if (
      !showGradient ||
      (isSong && ReactUtils.songColors.length < 4) ||
      (!isSong && ReactUtils.contentColors.length < 4)
    ) {
      ReactUtils.restoreGradient(isSong)
    }

    const colors = isSong ? ReactUtils.songColors : ReactUtils.contentColors

    const newIndex = (activeIndex + 1) % 2
    const newCanvas = canvasRefs[newIndex].current
    if (!newCanvas) return

    drawGradient(newCanvas, colors)

    const timeout = setTimeout(() => {
      setActiveIndex(newIndex)
    }, 100)

    return () => clearTimeout(timeout)
  }, [
    ReactUtils.songColors,
    ReactUtils.contentColors,
    showGradient,
    isExpanded,
  ])

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: -1, width, height }}
    >
      {[0, 1].map((i) => (
        <canvas
          key={i}
          ref={canvasRefs[i]}
          className={`absolute inset-0 h-full w-full brightness-65 transition-opacity duration-700 ${activeIndex === i && showGradient ? 'opacity-100' : 'opacity-0'} `}
          style={{ width, height }}
        />
      ))}
    </div>
  )
}

export default GradientBackground
