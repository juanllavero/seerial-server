import { useIsMobile } from '@/components/hooks/use-mobile'
import HorizontalList from '@/components/lists/HorizontalList'
import Loading from '@/components/Loading'
import { Collection } from '@/data/interfaces/Media'
import { MusicExtra } from '@/data/interfaces/Music'
import { authenticatedFetcher } from '@/lib/auth'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import VideoThumbnail from './VideoThumbnail'

interface ExtrasListProps {
  collection: Collection
}

function ExtrasList({ collection }: ExtrasListProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const { data: extras, isLoading } = useSWR<MusicExtra[]>(
    `/api/musicExtras/${collection.id}`,
    authenticatedFetcher,
  )

  const getExtraTypeTranslation = (type: string) => {
    switch (type) {
      case 'lyrics':
        return t('extraLyrics')
      case 'video':
        return t('extraVideo')
      case 'behindTheScenes':
        return t('extraBehindTheScenes')
      case 'live':
        return t('extraLive')
      case 'interview':
        return t('extraInterview')
      case 'concert':
        return t('extraConcert')
      default:
        return ''
    }
  }

  if (isLoading) return <Loading />

  if (!extras || extras.length === 0) return null

  return (
    <HorizontalList title="Extras">
      {extras.map((extra, index) => (
        <div key={'Extra media ' + index} className="space-y-2">
          <div className={isMobile ? 'w-80' : 'w-100'}>
            <VideoThumbnail
              key={index}
              videoUrl={`/api/video-file?path=${extra.src}`}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-md font-semibold">{extra.title}</span>
            <span className="text-sm">
              {getExtraTypeTranslation(extra.type)}
            </span>
          </div>
        </div>
      ))}
    </HorizontalList>
  )
}

export default ExtrasList
