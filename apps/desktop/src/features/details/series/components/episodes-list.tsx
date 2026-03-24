import { useGetSeason } from '@seerial/api';
import type { Episode, Season } from '@seerial/domain';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AnimatedImage } from '@/components/images/AnimatedImage';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationScrollView from '@/components/navigation/NavigationScrollView';
import Loading from '@/shared/components/loading';

interface EpisodesListProps {
  selectedSeasonId: string;
  selectedEpisode: Episode | null;
  selectEpisode: (episode: Episode | null) => void;
}

function EpisodesList({ selectedSeasonId, selectedEpisode, selectEpisode }: EpisodesListProps) {
  const navigate = useNavigate();
  const { data: season, isLoading } = useGetSeason<Season>(selectedSeasonId, undefined, {
    enabled: !!selectedSeasonId,
  });

  useEffect(() => {
    if (season && season.episodes.length > 0) {
      selectEpisode(season.episodes[0]);
    } else {
      selectEpisode(null);
    }
  }, [season, selectEpisode]);

  if (isLoading) return <Loading />;
  return (
    <NavigationScrollView className="gap-5 pb-5 z-10">
      {season?.episodes.map((episode) => (
        <NavigationButton
          key={episode.id}
          className={`cursor-pointer border-4 border-transparent ${selectedEpisode?.id === episode.id ? ' border-white' : ''}`}
          onClick={() => {
            if (selectedEpisode?.id === episode.id) {
              navigate(`/video-player/${episode.video.id}`);
            } else {
              selectEpisode(episode);
            }
          }}
        >
          <AnimatedImage
            uri={episode.video.imgSrc}
            width={300}
            style={{
              aspectRatio: '16/9',
              objectFit: 'cover',
            }}
          />
        </NavigationButton>
      ))}
    </NavigationScrollView>
  );
}

export default EpisodesList;
