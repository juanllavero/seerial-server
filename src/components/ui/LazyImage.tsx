import { Skeleton } from '@/components/ui/skeleton'
import { useServerStore } from '@/context/server.context'
import React, { useState } from 'react'

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
  errorSrc,
  className,
}: LazyImageProps) {
  const { serverIP } = useServerStore()
  const [loaded, setLoaded] = useState(false)
  const [imageSrc, setImageSrc] = useState(
    url ? (url.startsWith('http2') ? url : `https://${serverIP}/${url}`) : src,
  )

  const containerStyles = {
    width: width,
    height: height === 'auto' && aspectRatio !== 'auto' ? undefined : height,
    maxHeight: maxHeight,
    aspectRatio: aspectRatio !== 'auto' ? aspectRatio : undefined,
    position: 'relative' as const,
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
        onLoad={() => setLoaded(true)}
        onError={() => errorSrc && setImageSrc(errorSrc)}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${rounded ? 'rounded-full object-cover' : ''}`}
      />
    </div>
  )
}
