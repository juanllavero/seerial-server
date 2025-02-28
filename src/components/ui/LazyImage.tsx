import React, { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useServerStore } from '@/context/server.context'

interface LazyImageProps {
  src?: string
  url?: string
  alt?: string
  width?: number | string
  height?: number | string
  errorSrc?: string
  className?: string
}

export default function LazyImage({
  src,
  url,
  alt = '',
  width = 'auto',
  height = 'auto',
  errorSrc,
  className,
}: LazyImageProps) {
  const { serverIP } = useServerStore()
  const [loaded, setLoaded] = useState(false)
  const [imageSrc, setImageSrc] = useState(
    url ? (url.startsWith('http') ? url : `https://${serverIP}/${url}`) : src,
  )

  return (
    <div style={{ width, height }} className={`relative ${className}`}>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => errorSrc && setImageSrc(errorSrc)}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
