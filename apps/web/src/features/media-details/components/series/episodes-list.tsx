import { API, useCreate } from '@seerial/api';
import type { Episode } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { useDialogStore } from '@/features/management';
import FlexBox from '@/shared/ui/flex-box';
import EpisodeCard from '../cards/episode-card';
import EpisodeCardDetails from '../cards/episode-card-details';

interface EpisodesListProps {
  episodes: Episode[];
  distribution: number;
  seriesId: string;
  seasonId: string;
  mutate: (matcher: (key: string) => boolean) => Promise<unknown> | unknown;
}

function EpisodesList({ episodes, distribution, seriesId, seasonId, mutate }: EpisodesListProps) {
  const navigate = useNavigate();
  const { user } = useServerStore((state) => ({ user: state.currentUser }), shallow);
  const { openDialog } = useDialogStore((state) => ({ openDialog: state.openDialog }), shallow);
  const { create } = useCreate<unknown>();

  const goToEpisodePage = (episode: Episode) => {
    navigate(`/episode/${episode.id}`);
  };

  const playEpisode = async (episodeToPlay: Episode) => {
    if (!episodeToPlay.video?.id) {
      return;
    }

    navigate(`/video-player/${episodeToPlay.video.id}`);
  };

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
              action: async () => {
                await create(API.episodes.setWatchState(episode.id), {
                  episodeId: episode.id,
                  watched: true,
                  userId: user?.id,
                });

                mutate((key: string) => key.startsWith(API.series.get(seriesId || '')));
                mutate((key: string) => key.startsWith(API.seasons.get(seasonId || '')));
              },
            },
            {
              title: t('markUnwatched'),
              action: async () => {
                await create(API.episodes.setWatchState(episode.id), {
                  episodeId: episode.id,
                  watched: false,
                  userId: user?.id,
                });

                mutate((key: string) => key.startsWith(API.series.get(seriesId || '')));
                mutate((key: string) => key.startsWith(API.seasons.get(seasonId || '')));
              },
            },
          ],
        },
      ],
    };
  };

  return (
    <>
      {distribution === 0 ? (
        <FlexBox gap={1} wrap="wrap" justify="start" align="start" width="100%" height={'100%'}>
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
  );
}

export default EpisodesList;
