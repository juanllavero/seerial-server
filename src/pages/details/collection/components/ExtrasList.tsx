import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { MusicExtra } from '@/data/interfaces/Music'
import HorizontalList from '@/components/lists/HorizontalList'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import VideoThumbnail from './VideoThumbnail'
import { useTranslation } from 'react-i18next'

interface ExtrasListProps {
  collection: Collection
}

function ExtrasList({ collection }: ExtrasListProps) {
  const { t } = useTranslation()
  const selectedServer = useServerStore((state) => state.selectedServer)

  const { data: extras, isLoading } = useSWR<MusicExtra[]>(
    selectedServer
      ? `https://${selectedServer.ip}/musicExtras/${collection.id}`
      : null,
    fetcher,
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
          <div className="w-100">
            <VideoThumbnail
              key={index}
              videoUrl={`https://${selectedServer?.ip}/video-file?path=${extra.src}`}
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
