import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Skeleton } from '@/components/ui/skeleton'
import { API, authenticatedFetcher } from '@/config/api'
import { useDialogStore } from '@/context/dialog.context'
import { Movie, Season, Series } from '@/data/interfaces/Media'
import { Download, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'

interface MediaTabProps {
  series?: Series
  season?: Season
  movie?: Movie
}

function MediaTab({ series, season, movie }: MediaTabProps) {
  const { t } = useTranslation()
  const isTablet = useIsTablet()
  const openDownloadMediaDialog = useDialogStore(
    (state) => state.openDownloadMediaDialog,
  )

  const type = series ? 'series' : season ? 'season' : 'movie'
  const id = series ? series.id : season ? season.id : movie?.id

  // Background video
  const {
    data: video,
    isLoading: loadingVideo,
    error: videoError,
  } = useSWR(
    `${API.media.background(type, 'video')}?id=${id}`,
    authenticatedFetcher,
    {
      revalidateAll: true,
      refreshInterval: 1000,
    },
  )

  // Background music
  const {
    data: music,
    isLoading: loadingMusic,
    error: musicError,
  } = useSWR(
    `${API.media.background(type, 'music')}?id=${id}`,
    authenticatedFetcher,
    {
      revalidateAll: true,
      refreshInterval: 1000,
    },
  )

  const openDownloadDialog = (type: 'music' | 'video') => {
    openDownloadMediaDialog(type, series, season, movie)
  }

  const removeVideo = () => {
    //Handles remove video
  }

  const removeMusic = () => {
    //Handles remove music
  }

  const renderVideoSection = () => {
    if (loadingVideo) {
      return (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('video')}</h3>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
          <Skeleton className={`w-full ${isTablet ? 'h-48' : 'h-64'}`} />
        </div>
      )
    }

    if (videoError || !video) {
      return (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('video')}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDownloadDialog('video')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('downloadButton')}
            </Button>
          </div>
          <div
            className={`w-full ${isTablet ? 'h-48' : 'h-64'} bg-muted flex items-center justify-center rounded-lg`}
          >
            <p className="text-muted-foreground px-4 text-center">
              {videoError ? t('errorLoadingVideo') : t('noVideoAvailable')}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('video')}</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDownloadDialog('video')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('downloadButton')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={removeVideo}
              className="text-destructive hover:text-destructive flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('removeButton')}
            </Button>
          </div>
        </div>
        <video
          controls
          className={`w-full ${isTablet ? 'h-48' : 'h-64'} rounded-lg`}
          src={`/api/${video.url}`}
          onError={(e) => {
            console.error('Video loading error:', e)
          }}
        >
          {t('videoNotSupported')}
        </video>
      </div>
    )
  }

  const renderMusicSection = () => {
    if (loadingMusic) {
      return (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('music')}</h3>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      )
    }

    if (musicError || !music) {
      return (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('music')}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDownloadDialog('music')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('downloadButton')}
            </Button>
          </div>
          <div className="bg-muted flex h-12 w-full items-center justify-center rounded-lg">
            <p className="text-muted-foreground text-sm">
              {musicError ? t('errorLoadingMusic') : t('noMusicAvailable')}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('music')}</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDownloadDialog('music')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('downloadButton')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={removeMusic}
              className="text-destructive hover:text-destructive flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('removeButton')}
            </Button>
          </div>
        </div>
        <audio
          controls
          className="w-full"
          src={`/api/${music.url}`}
          onError={(e) => {
            console.error('Audio loading error:', e)
          }}
        >
          {t('audioNotSupported')}
        </audio>
      </div>
    )
  }

  return (
    <FlexBox
      direction="column"
      gap={6}
      justify="start"
      align="center"
      height={isTablet ? '25rem' : '35rem'}
      hideScrollbar={isTablet}
      scroll="vertical"
      className="p-4"
    >
      {renderVideoSection()}
      {renderMusicSection()}
    </FlexBox>
  )
}

export default memo(MediaTab)
