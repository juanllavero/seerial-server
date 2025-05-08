import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import { Movie, Video } from '@/data/interfaces/Media'
import HorizontalList from '@/pages/home/components/HorizontalList'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import { useTranslation } from 'react-i18next'
import VideoCard from './cards/VideoCard'

interface MovieContentProps {
  movie: Movie
}

function MovieContent({ movie }: MovieContentProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const getEpisodeMenu = () => {
    return {
      items: [
        {
          items: [
            {
              title: 'Editar',
              action: () => {},
            },
            {
              title: 'Eliminar',
              action: () => {},
            },
          ],
        },
      ],
    }
  }

  const playEpisode = async (video: Video) => {
    navigate({
      to: '/video-player/$videoId',
      params: {
        videoId: video.id,
      },
    })
  }

  const onlyMovie = movie.videos.length === 1

  return (
    <FlexBox
      direction="column"
      gap={2}
      margin="1rem 0 0 0"
      padding={isMobile ? '1rem 2rem' : '0'}
      width={'100%'}
    >
      {movie.videos && movie.videos.length > 1 && (
        <HorizontalList title={t('videos')}>
          {movie.videos.map((video) => (
            <VideoCard
              video={video}
              playVideo={playEpisode}
              getVideoMenu={getEpisodeMenu}
              title={video.title}
              subtitle={''}
            />
          ))}
        </HorizontalList>
      )}

      {movie.extras && movie.extras.length > 0 && (
        <HorizontalList title={t('extras')}>
          {movie.extras.map((video) => (
            <VideoCard
              video={video}
              playVideo={playEpisode}
              getVideoMenu={getEpisodeMenu}
              title={video.title}
              subtitle={video.extraType ? t(video.extraType) : ''}
            />
          ))}
        </HorizontalList>
      )}
    </FlexBox>
  )
}

export default MovieContent
