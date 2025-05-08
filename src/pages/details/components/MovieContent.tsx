import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import { useServerStore } from '@/context/server.context'
import { Episode, Movie } from '@/data/interfaces/Media'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import EpisodeCard from './cards/EpisodeCard'

interface MovieContentProps {
  movie: Movie
}

function MovieContent({ movie }: MovieContentProps) {
  const navigate = useNavigate()
  const { serverIP } = useServerStore()
  const isMobile = useIsMobile()

  const getEpisodeMenu = (episode: Episode) => {
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

  const goToDetails = (episode: Episode) => {
    navigate({
      to: '/details/episode/$episodeId',
      params: {
        episodeId: episode.id,
      },
    })
  }

  const playEpisode = async (episode: Episode) => {
    const response = await fetch(
      `http://${serverIP}/episode-video?episodeId=${episode.id}`,
    )

    if (!response.ok) {
      // Show error message
      return
    }

    const data = await response.json()
    navigate({
      to: '/video-player/$videoId',
      params: {
        videoId: data.videoId,
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
      <Grid
        columns={
          isMobile
            ? 'repeat(auto-fill, minmax(200px, 1fr))'
            : 'repeat(auto-fill, minmax(400px, 1fr))'
        }
        gap="1rem"
        width="100%"
      >
        {movie.videos.map((video) => (
          <EpisodeCard
            episode={video}
            playEpisode={playEpisode}
            goToDetails={goToDetails}
            getEpisodeMenu={getEpisodeMenu}
          />
        ))}
      </Grid>
    </FlexBox>
  )
}

export default MovieContent
