import { t } from 'i18next'
import { toast } from 'sonner'
import { mutate } from 'swr'
import Image from '@/components/ui/Image'
import { API, authenticatedFetch } from '@/config/api'
import { useWebSocketStore } from '@/context/ws.context'
import { ScreenHeight } from '@/data/enums/Screen'
import type { Collection, Video } from '@/data/interfaces/Media'
import { iso1to3 } from './utils'

const tailwindSizes = [40, 48, 56, 60, 64, 72, 80, 96, 100, 112, 120, 128, 144, 160, 192]

export const getVideoProgress = (video: Video, watchedTime?: number) => {
  const timeWatched = watchedTime
    ? watchedTime / 60
    : video.timeWatched
      ? video.timeWatched / 60
      : 0
  const duration = video.duration ?? video.runtime ?? 0
  if (duration > 0 && timeWatched > 0) {
    return duration - timeWatched
  }
  return undefined
}

export const toggleMovieWatched = (id: string, newState: boolean, userId: string) => {
  authenticatedFetch(API.movies.setWatchState(id), 'POST', {
    movieId: id,
    watched: newState,
    userId,
  }).then(() => {
    mutate((key: string) => key.startsWith(`/api/myListMovies`))
    mutate((key: string) => key.startsWith(`/api/library-content`))
    mutate((key: string) => key.startsWith(`/api/movie`))
  })
}

export const toggleSeriesWatched = (id: string, newState: boolean, userId: string) => {
  authenticatedFetch(API.series.setWatchState(id), 'POST', {
    seriesId: id,
    watched: newState,
    userId,
  }).then(() => {
    mutate((key: string) => key.startsWith(`/api/myListSeries`))
    mutate((key: string) => key.startsWith(`/api/library-content`))
    mutate((key: string) => key.startsWith(`/api/series`))
  })
}

export const refreshMetadata = async (type: 'show' | 'movie', id: string) => {
  const connectWS = useWebSocketStore((state) => state.connectWS)

  await connectWS()
  const response = await authenticatedFetch(
    `/api/${type === 'show' ? 'refreshShowMetadata' : 'refreshMovieMetadata'}`,
    'POST',
    {
      id,
    },
  )

  if (!response.data) {
    showToast('error', t('refreshMetadataError'))
    return
  }

  showToast('info', t('refreshMetadataStart'))
}

//#region IMAGES AND TITLES
export const getCoverSize = (
  screenHeight: ScreenHeight,
  isPoster: boolean,
  isBackground: boolean,
) => {
  let height: number

  switch (screenHeight) {
    case ScreenHeight.HD:
      height = 60
      break
    case ScreenHeight.FHD:
      height = 80
      break
    case ScreenHeight.QHD:
      height = 100
      break
    case ScreenHeight.UHD:
      height = 120
      break
    default:
      return 'w-60 h-60'
  }

  let aspectRatio = 1

  if (isPoster) aspectRatio = 2 / 3
  else if (isBackground) aspectRatio = 16 / 9

  const idealWidth = height * aspectRatio

  // Get closest width from tailwind
  const closestWidth = tailwindSizes.reduce((prev, curr) =>
    Math.abs(curr - idealWidth) < Math.abs(prev - idealWidth) ? curr : prev,
  )

  return `w-${closestWidth} h-${height}`
}

export const getTitleSize = (screenHeight: ScreenHeight, isMobile: boolean) => {
  if (isMobile) return 'text-3xl'
  switch (screenHeight) {
    case ScreenHeight.HD:
      return 'text-3xl'
    case ScreenHeight.FHD:
      return 'text-4xl'
    case ScreenHeight.QHD:
      return 'text-5xl'
    case ScreenHeight.UHD:
      return 'text-6xl'
  }
}
//#endregion

//#region DATETIME
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)

  const monthOptions: Intl.DateTimeFormatOptions = { month: 'short' }

  const month = date.toLocaleString('en-US', monthOptions)
  const day = date.getDate()
  const year = date.getFullYear()

  return `${month} ${day}, ${year}`
}

export const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

export const formatTimeForView = (time: number) => {
  const hours = Math.floor(time / 60)
  const minutes = Math.floor(time % 60)

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${hours}h`
    }
  } else {
    return `${minutes}m`
  }
}

export const getOnlyYear = (date: string) => {
  const year = new Date(date).getFullYear()
  return year
}
//#endregion

export const getEpisodeGroupType = (type: number) => {
  switch (type) {
    case 1:
      return 'Original air date'
    case 2:
      return 'Absolute'
    case 3:
      return 'DVD'
    case 4:
      return 'Digital'
    case 5:
      return 'Story arc'
    case 6:
      return 'Production'
    case 7:
      return 'TV'
    default:
      return 'Unknown'
  }
}

export const getAudioTrack = (prefAudioLan: string, video: Video) => {
  if (!video.audioTracks || video.audioTracks.length === 0) return null

  if (
    video.selectedAudioTrack &&
    video.selectedAudioTrack !== -1 &&
    video.selectedAudioTrack < video.audioTracks.length
  ) {
    return video.audioTracks[video.selectedAudioTrack]
  } else {
    if (prefAudioLan !== '') {
      const track = video.audioTracks.find((track) => track.language === prefAudioLan)
      if (track) return track
    }

    return video.audioTracks[0]
  }
}

export const getSubtitleTrack = (prefSubsLan: string, subsMode: string, video: Video) => {
  if (!video.subtitleTracks || video.subtitleTracks.length === 0) return null

  if (
    video.selectedSubtitleTrack &&
    video.selectedSubtitleTrack !== -1 &&
    video.selectedSubtitleTrack < video.subtitleTracks.length
  ) {
    return video.subtitleTracks[video.selectedSubtitleTrack]
  } else {
    // Convert 2-letter code to 3-letter code
    const targetLang = iso1to3[prefSubsLan] ?? prefSubsLan

    const defaultTrack =
      subsMode === 'alwaysSubs'
        ? video.subtitleTracks.length > 0
          ? video.subtitleTracks[0]
          : null
        : null

    switch (subsMode) {
      case 'autoSubs':
      case 'alwaysSubs':
        return (
          video.subtitleTracks.findLast((track) => track.languageTag === targetLang) ?? defaultTrack
        )
      default:
        return null
    }
  }
}

export const generateRandoumUUID = () => {
  // Generates 4 random bytes (32 bits)
  const array = new Uint8Array(4)
  window.crypto.getRandomValues(array)
  // Converts the bytes to hexadecimal
  return Array.from(array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * This method is used to show a toast notification.
 * @param title The title of the toast
 * @param message The message of the toast
 * @param type The type of the toast
 */
export const showToast = (
  type: 'success' | 'error' | 'warning' | 'info' | 'message' | 'default' = 'default',
  message: string,
  title?: string,
  duration?: number,
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right',
) => {
  switch (type) {
    case 'message':
      toast.message(title, {
        description: message,
        duration: duration,
        position: position,
      })
      break
    case 'success':
      toast.success(message, {
        duration: duration,
        position: position,
      })
      break
    case 'error':
      toast.error(message, {
        duration: duration,
        position: position,
      })
      break
    case 'warning':
      toast.warning(message, {
        duration: duration,
        position: position,
      })
      break
    case 'info':
      toast.info(message, {
        duration: duration,
        position: position,
      })
      break
    case 'default':
      toast(message, {
        duration: duration,
        position: position,
      })
      break
  }
}

/**
 * This method is used to show a toast notification for a promise.
 * @param promise The promise to be resolved
 * @param loadingMessage The message to be displayed while the promise is loading
 * @param successMessage The message to be displayed when the promise is resolved
 * @param errorMessage The message to be displayed when the promise is rejected
 */
export const showPromiseToast = (
  promise: Promise<any>,
  loadingMessage: string,
  successMessage: string,
  errorMessage: string,
) => {
  toast.promise(promise, {
    loading: loadingMessage,
    success: () => {
      return successMessage
    },
    error: errorMessage,
  })
}

export const isAbsolutePath = (pathString: string): boolean => {
  const windowsPathRegex = /^[a-zA-Z]:[\\/]/
  const unixPathRegex = /^\//

  return windowsPathRegex.test(pathString) || unixPathRegex.test(pathString)
}

export const getFirstImage = (collection: Collection, type: string) => {
  if (type === 'Movies' && collection.movies && collection.movies.length > 0) {
    return collection.movies[0].coverSrc
  } else if (type === 'Series' && collection.shows && collection.shows.length > 0) {
    return collection.shows[0].coverSrc
  } else if (type === 'Music' && collection.albums && collection.albums.length > 0) {
    return collection.albums[0].coverSrc
  }
  return ''
}

export const getPosterImage = (collectionId: string, images: string[], type: string) => {
  // If no images, return null or a placeholder
  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Image
          key={'Placeholder image for ' + type + ' collection' + collectionId}
          src={type === 'Music' ? '/img/songDefault.png' : '/img/fileNotFound.jpg'}
          alt={`Collection item ${collectionId}`}
          className="h-full w-full object-cover"
          aspectRatio={type === 'Music' ? 1 : 2 / 3}
        />
      </div>
    )
  }

  // Fill with placeholder images if 1 < images < 4
  if (images.length > 1 && images.length < 4) {
    const placeholdersNeeded = 4 - images.length
    for (let i = 0; i < placeholdersNeeded; i++) {
      images.push(`local/img/${type === 'Music' ? 'songDefault.png' : 'fileNotFound.jpg'}`)
    }
  }

  // Determine grid layout based on number of images
  const gridClass = 'grid-cols-2'

  if (images.length === 1) {
    return undefined
  }

  return (
    <div className={`grid ${gridClass} h-full w-full gap-1`}>
      {images.map((src, index) => {
        return (
          <Image
            key={index}
            url={src}
            alt={`Collection item ${index + 1}`}
            className="h-full w-full object-cover"
            fallbackSrc={type === 'Music' ? '/img/songDefault.png' : '/img/fileNotFound.jpg'}
            aspectRatio={type === 'Music' ? 1 : 2 / 3}
          />
        )
      })}
    </div>
  )
}
