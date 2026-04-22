import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type { Episode, Season } from '@seerial/domain';
import { useEffect, useMemo } from 'react';
import { useRelatedContent } from '@/features/details';
import { NavigationScrollView } from '@/shared/components/navigation';
import { Skeleton } from '@/shared/components/ui/skeleton';
import EpisodeCard from './episode-card';

export const MAX_SKELETON_COUNT = 10;

interface EpisodesListProps {
  selectedSeason: Season | null;
  selectedEpisode: Episode | null;
  selectEpisode: (episode: Episode) => void;
  isRestoringFocus?: boolean;
  isLoading?: boolean;
  skeletonCount?: number;
}

function EpisodesList({
  selectedSeason,
  selectedEpisode,
  selectEpisode,
  isRestoringFocus = true,
  isLoading = false,
  skeletonCount = MAX_SKELETON_COUNT,
}: EpisodesListProps) {
  const { navigateToRelated, hasRelatedContent } = useRelatedContent();
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

  const clampedSkeletonCount = Math.min(skeletonCount, MAX_SKELETON_COUNT);

  if (isLoading) {
    return (
      <div className="flex gap-5 py-5 z-10 w-full overflow-hidden">
        {Array.from({ length: clampedSkeletonCount }, (_, i) => `skeleton-${i}`).map((key) => (
          <Skeleton
            key={key}
            className="shrink-0 rounded-md"
            style={{ height: '22vh', aspectRatio: '16/9' }}
          />
        ))}
      </div>
    );
  }

  return (
    <NavigationScrollView
      className="gap-5 py-5 z-10 w-full"
      direction="horizontal"
      scrollMode="center"
      focusedElementId={selectedEpisode?.id}
      isRestoringFocus={isRestoringFocus}
    >
      {sortedEpisodes.map((episode, index) => (
        <EpisodeCard
          key={episode.id}
          episode={episode}
          selectedEpisodeId={selectedEpisode?.id}
          onFocus={selectEpisode}
          onArrowPress={
            index === sortedEpisodes.length - 1 && hasRelatedContent
              ? (direction) => {
                  if (direction === 'right') {
                    navigateToRelated();
                    return false;
                  }
                  return true;
                }
              : undefined
          }
        />
      ))}
    </NavigationScrollView>
  );
}

export default EpisodesList;
