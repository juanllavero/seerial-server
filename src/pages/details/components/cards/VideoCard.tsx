import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Video } from '@/data/interfaces/Media'
import { Pencil } from 'lucide-react'
import React from 'react'

interface VideoCardProps {
  video: Video
  title: string
  subtitle: string
  playVideo: (video: Video) => void
  getVideoMenu: (video: Video) => any
}

function VideoCard({
  video,
  title,
  subtitle,
  playVideo,
  getVideoMenu,
}: VideoCardProps) {
  const isMobile = useIsMobile()

  return (
    <Card
      itemKey={video.id}
      imgSrc={video.imgSrc}
      aspectRatio={16 / 9}
      width={isMobile ? '100%' : 400}
      progress={
        (video.timeWatched / (video.runtime * 60)) * 100 > 0
          ? (video.timeWatched / (video.runtime * 60)) * 100
          : undefined
      }
      title={title}
      subtitle={subtitle}
      action={() => playVideo(video)}
      playButtonAction={() => playVideo(video)}
      menu={getVideoMenu(video)}
      editModal={
        <Button
          variant={'ghost'}
          size={'icon'}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <Pencil size={16} />
        </Button>
      }
      errorSrc="/img/Default_video_thumbnail.jpg"
    />
  )
}

export default VideoCard
