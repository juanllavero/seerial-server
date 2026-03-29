import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type { Episode, Season } from '@seerial/domain';
import { useEffect, useMemo } from 'react';
import NavigationScrollView from '@/components/navigation/NavigationScrollView';
import Loading from '@/shared/components/loading';
import EpisodeCard from './episode-card';

interface EpisodesListProps {
  selectedSeason: Season | null;
  selectedEpisode: Episode | null;
  selectEpisode: (episode: Episode) => void;
  isRestoringFocus?: boolean;
}

function EpisodesList({
  selectedSeason,
  selectedEpisode,
  selectEpisode,
  isRestoringFocus = true,
}: EpisodesListProps) {
  const sortedEpisodes = useMemo(() => {
    if (!selectedSeason) {
      return [];
    }

    return [...selectedSeason.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
  }, [selectedSeason]);

  useEffect(() => {
    if (!isRestoringFocus || !selectedEpisode?.id) {
      return;
    }

    setFocus(selectedEpisode.id);
  }, [selectedEpisode?.id, isRestoringFocus]);

  if (!selectedSeason) return <Loading />;

  return (
    <NavigationScrollView
      className="gap-5 pb-5 z-10 w-full"
      direction="horizontal"
      scrollMode="center"
      focusedElementId={selectedEpisode?.id}
      isRestoringFocus={isRestoringFocus}
    >
      {sortedEpisodes.map((episode) => (
        <EpisodeCard
          key={episode.id}
          episode={episode}
          selectedEpisodeId={selectedEpisode?.id}
          onFocus={selectEpisode}
        />
      ))}
    </NavigationScrollView>
  );
}

export default EpisodesList;
