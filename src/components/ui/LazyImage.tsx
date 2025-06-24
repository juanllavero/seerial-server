import { Skeleton } from '@/components/ui/skeleton'
import { useServerStore } from '@/context/server.context'
import { memo, useEffect, useMemo, useState } from 'react'

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
  onLoad?: () => void
  className?: string
}

function LazyImage({
  src,
  url,
  alt = '',
  width = 'auto',
  height = 'auto',
  aspectRatio = 'auto',
  maxHeight,
  rounded = false,
  errorSrc = '/img/fileNotFound.jpg',
  onLoad,
  className,
}: LazyImageProps) {
  const { selectedServer } = useServerStore()
  const serverIP = useMemo(() => selectedServer?.ip, [selectedServer?.ip])

  const [loaded, setLoaded] = useState(false)
  const [imageSrc, setImageSrc] = useState(
    url
      ? url.startsWith('http2')
        ? url
        : `https://${serverIP}/${url.replace('resources/img', 'img')}`
      : (src ?? errorSrc),
  )
  const [hasError, setHasError] = useState(false) // New state to track errors

  useEffect(() => {
    const newSrc = url
      ? url.startsWith('http2')
        ? url
        : `https://${serverIP}/${url.replace('resources/img', 'img')}`
      : src
    if (imageSrc !== newSrc) setImageSrc(newSrc ?? errorSrc)
    setLoaded(false) // Reset loaded to show skeleton while loading new image
    setHasError(false) // Reset error state
  }, [url, src, selectedServer])

  const containerStyles = {
    width: width,
    height: height === 'auto' && aspectRatio !== 'auto' ? undefined : height,
    maxHeight: maxHeight,
    aspectRatio: aspectRatio !== 'auto' ? aspectRatio : undefined,
    position: 'relative' as const,
    borderRadius: rounded ? '5px' : undefined,
  }

  if (imageSrc === '') {
    return (
      <Skeleton
        style={{
          width: typeof width === 'number' ? `${width}px` : '100%',
          height: typeof maxHeight === 'number' ? `${maxHeight}px` : '100%',
        }}
      />
    )
  }

  return (
    <div style={containerStyles} className={`relative ${className}`}>
      {!loaded && (
        <Skeleton
          style={{
            width: typeof width === 'number' ? `${width}px` : '100%',
            height: typeof maxHeight === 'number' ? `${maxHeight}px` : '100%',
          }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width === 'auto' ? undefined : width}
        height={maxHeight ? maxHeight : height === 'auto' ? undefined : height}
        loading="lazy"
        style={{ borderRadius: !rounded ? '5px' : undefined }}
        onLoad={() => {
          setLoaded(true)
          onLoad?.()
        }} // Triggered when the image (original or errorSrc) loads
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

export default memo(LazyImage)
