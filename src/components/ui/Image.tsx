import { useState, useRef, useEffect } from 'react'
import { useIsMobile } from '../hooks/use-mobile'
import { useIsTablet } from '../hooks/use-tablet'
import { Skeleton } from './skeleton'
import { useServerStore } from '@/context/server.context'

interface ImageProps {
  url?: string
  src?: string
  fallbackSrc?: string
  alt: string
  aspectRatio: number
  width?: number
  height?: number
  className?: string
  onClick?: () => void
}

const Image: React.FC<ImageProps> = ({
  url,
  src,
  fallbackSrc,
  alt,
  aspectRatio,
  width,
  height,
  className = '',
  onClick,
}) => {
  const { selectedServer } = useServerStore()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  const [imageSrc, setImageSrc] = useState(
    url
      ? url.startsWith('http')
        ? url
        : `https://${selectedServer?.ip}/${url.replace('resources/img', 'img')}`
      : (src ?? fallbackSrc),
  )

  // Update imageSrc when url, src, or selectedServer changes
  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
    const newSrc = url
      ? url.startsWith('http')
        ? url
        : `https://${selectedServer?.ip}/${url.replace('resources/img', 'img')}`
      : (src ?? fallbackSrc)
    setImageSrc(newSrc)
  }, [url, src, selectedServer, fallbackSrc])

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const calculateDimensions = () => {
    if (isMobile || isTablet) {
      return {
        containerClass: 'w-full',
        aspectRatioStyle: { aspectRatio: aspectRatio.toString() },
      }
    }

    if (width && !height) {
      const calculatedHeight = Math.round(width / aspectRatio)
      return {
        containerClass: `w-${width} h-${calculatedHeight}`,
        aspectRatioStyle: {},
      }
    } else if (height && !width) {
      const calculatedWidth = Math.round(height * aspectRatio)
      return {
        containerClass: `w-${calculatedWidth} h-${height}`,
        aspectRatioStyle: {},
      }
    } else if (width && height) {
      return {
        containerClass: `w-${width} h-${height}`,
        aspectRatioStyle: {},
      }
    } else {
      return {
        containerClass: 'w-full',
        aspectRatioStyle: { aspectRatio: aspectRatio.toString() },
      }
    }
  }

  const { containerClass, aspectRatioStyle } = calculateDimensions()

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true)
      if (imgRef.current) {
        imgRef.current.src = fallbackSrc ?? ''
      }
    } else {
      setIsLoading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${containerClass} ${className}`}
      style={aspectRatioStyle}
      onClick={onClick}
    >
      {isLoading && <Skeleton className="absolute inset-0 h-full w-full" />}

      {isInView && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`h-full w-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} `}
          loading="lazy"
        />
      )}

      {/* Fallback when every image fails */}
      {!isLoading && hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

export default Image
