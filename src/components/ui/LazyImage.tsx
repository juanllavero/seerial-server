import { Skeleton } from '@/components/ui/skeleton'
import { useServerStore } from '@/context/server.context'
import React, { useEffect, useState } from 'react'

interface LazyImageProps {
  src?: string
  url?: string
  alt?: string
  width?: number | string
  height?: number | string
  maxHeight?: number | string
  aspectRatio?: string
  rounded?: boolean
  errorSrc?: string
  className?: string
}

export default function LazyImage({
  src,
  url,
  alt = '',
  width = 'auto',
  height = 'auto',
  aspectRatio = 'auto',
  maxHeight,
  rounded = false,
  errorSrc = '/img/fileNotFound.jpg',
  className,
}: LazyImageProps) {
  const { serverIP } = useServerStore()
  const [loaded, setLoaded] = useState(false)
  const [imageSrc, setImageSrc] = useState(
    url
      ? url.startsWith('http')
        ? url
        : `https://${serverIP}/${url.replace('resources/img', 'img')}`
      : (src ?? errorSrc),
  )
  const [hasError, setHasError] = useState(false) // New state to track errors

  useEffect(() => {
    const newSrc = url
      ? url.startsWith('http')
        ? url
        : `https://${serverIP}/${url.replace('resources/img', 'img')}`
      : src
    setImageSrc(newSrc ?? errorSrc)
    setLoaded(false) // Reset loaded to show skeleton while loading new image
    setHasError(false) // Reset error state
  }, [url, src, serverIP])

  const containerStyles = {
    width: width,
    height: height === 'auto' && aspectRatio !== 'auto' ? undefined : height,
    maxHeight: maxHeight,
    aspectRatio: aspectRatio !== 'auto' ? aspectRatio : undefined,
    position: 'relative' as const,
    borderRadius: rounded ? '5px' : undefined,
  }

  return (
    <div style={containerStyles} className={`relative ${className}`}>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
      <img
        src={imageSrc}
        alt={alt}
        width={width === 'auto' ? undefined : width}
        height={maxHeight ? maxHeight : height === 'auto' ? undefined : height}
        loading="lazy"
        style={{ borderRadius: !rounded ? '5px' : undefined }}
        onLoad={() => setLoaded(true)} // Triggered when the image (original or errorSrc) loads
        onError={() => {
          if (!hasError && errorSrc) {
            // Only change to errorSrc if it hasn't failed before
            setImageSrc(errorSrc)
            setHasError(true) // Mark that there was an error to avoid loops
          } else {
            setLoaded(true) // If there is no errorSrc or it has already failed, hide the skeleton
          }
        }}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${rounded ? 'rounded-full object-cover' : ''}`}
      />
    </div>
  )
}
