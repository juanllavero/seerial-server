import FlexBox from '@/components/ui/FlexBox'
import { API, authenticatedFetch } from '@/config/api'
import { useServerStore } from '@/context/auth.store'
import { useDialogStore } from '@/context/dialog.store'
import { Episode } from '@/data/interfaces/Media'
import { t } from 'i18next'
import { useNavigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import EpisodeCard from '../../components/cards/EpisodeCard'
import EpisodeCardDetails from '../../components/cards/EpisodeCardDetails'

interface EpisodesListProps {
  episodes: Episode[]
  distribution: number
  seriesId: string
  seasonId: string
  mutate: any
}

function EpisodesList({
  episodes,
  distribution,
  seriesId,
  seasonId,
  mutate,
}: EpisodesListProps) {
  const navigate = useNavigate()
  const { user } = useServerStore(
    (state) => ({ user: state.currentUser }),
    shallow,
  )
  const { openDialog } = useDialogStore(
    (state) => ({ openDialog: state.openDialog }),
    shallow,
  )

  const goToEpisodePage = (episode: Episode) => {
    navigate(`/episode/${episode.id}`)
  }

  const playEpisode = async (episodeId: Episode) => {
    const response = await authenticatedFetch(
      API.videos.getByEpisodeId(episodeId.id),
    )

    if (!response.data) {
      return
    }

    const data = await response.data
    navigate(`/video-player/${data.id}`)
  }

  const getEpisodeMenu = (episode: Episode) => {
    return {
      items: [
        {
          items: [
            {
              title: 'Editar',
              action: () => openDialog('episode', { id: episode.id }),
            },
            {
              title: 'Eliminar',
              action: () => openDialog('deleteEpisode', { id: episode.id }),
            },
            {
              title: t('markWatched'),
              action: () => {
                authenticatedFetch(
                  API.episodes.setWatchState(episode.id),
                  'POST',
                  {
                    episodeId: episode.id,
                    watched: true,
                    userId: user?.id,
                  },
                ).finally(() => {
                  mutate((key: string) =>
                    key.startsWith(API.series.get(seriesId || '')),
                  )
                  mutate((key: string) =>
                    key.startsWith(API.seasons.get(seasonId || '')),
                  )
                })
              },
            },
            {
              title: t('markUnwatched'),
              action: () => {
                authenticatedFetch(
                  API.episodes.setWatchState(episode.id),
                  'POST',
                  {
                    episodeId: episode.id,
                    watched: false,
                    userId: user?.id,
                  },
                ).finally(() => {
                  mutate((key: string) =>
                    key.startsWith(API.series.get(seriesId || '')),
                  )
                  mutate((key: string) =>
                    key.startsWith(API.seasons.get(seasonId || '')),
                  )
                })
              },
            },
          ],
        },
      ],
    }
  }

  return (
    <>
      {distribution === 0 ? (
        <FlexBox
          gap={1}
          wrap="wrap"
          justify="start"
          align="start"
          width="100%"
          height={'100%'}
        >
          {episodes
            .sort((a, b) => a.episodeNumber - b.episodeNumber)
            .map((episode) => (
              <EpisodeCard
                key={'Episode card' + episode.id}
                episode={episode}
                playEpisode={playEpisode}
                goToDetails={goToEpisodePage}
                getEpisodeMenu={getEpisodeMenu}
                editEpisode={() => openDialog('episode', { id: episode.id })}
              />
            ))}
        </FlexBox>
      ) : (
        <FlexBox direction="column" gap={0.5}>
          {episodes
            .sort((a, b) => a.episodeNumber - b.episodeNumber)
            .map((episode) => (
              <EpisodeCardDetails
                key={'Episode details' + episode.id}
                episode={episode}
                playEpisode={playEpisode}
                goToDetails={goToEpisodePage}
                getEpisodeMenu={getEpisodeMenu}
                editEpisode={() => openDialog('episode', { id: episode.id })}
              />
            ))}
        </FlexBox>
      )}
    </>
  )
}

export default EpisodesList
