import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { DESKTOP_PADDING_LEFT, type Episode, type Season } from '@seerial/domain';
import { t } from 'i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRelatedContent } from '@/features/details';
import VideoCard from '@/shared/components/details/video-card';
import { NavigationScrollView } from '@/shared/components/navigation';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import { useSettingsStore } from '@/shared/stores';

export const MAX_SKELETON_COUNT = 10;

interface EpisodesListProps {
  selectedSeason: Season | null;
  selectedEpisode: Episode | null;
  selectEpisode: (episode: Episode) => void;
  isRestoringFocus?: boolean;
  isLoading?: boolean;
  skeletonCount?: number;
  hideUnwatchedThumbnails?: boolean;
  seasonBackgroundSrc?: string;
}

function EpisodesList({
  selectedSeason,
  selectedEpisode,
  selectEpisode,
  isRestoringFocus = true,
  isLoading = false,
  skeletonCount = MAX_SKELETON_COUNT,
  hideUnwatchedThumbnails = false,
  seasonBackgroundSrc,
}: EpisodesListProps) {
  const { navigateToRelated, hasRelatedContent } = useRelatedContent();
  const [isAnyEpisodeFocused, setIsAnyEpisodeFocused] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { cardRoundness } = useSettingsStore((state) => ({
    cardRoundness: state.settings.cardRoundness,
  }));
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
      <div
        className="flex gap-5 pt-5 z-10 w-full overflow-hidden"
        style={{ paddingLeft: DESKTOP_PADDING_LEFT }}
      >
        {Array.from({ length: clampedSkeletonCount }, (_, i) => `skeleton-${i}`).map((key) => (
          <div
            key={key}
            className={`shrink-0 p-0
              ${cardRoundness} scale-95 border-2 border-transparent transition-all duration-350`}
            style={{
              height: '22vh',
            }}
          >
            <Skeleton
              key={key}
              className={`shrink-0 ${cardRoundness} h-full w-full`}
              style={{ aspectRatio: '16/9' }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <NavigationScrollView
      className="gap-5 pt-5 z-10 w-full"
      direction="horizontal"
      scrollMode="center"
      focusedElementId={selectedEpisode?.id}
      isRestoringFocus={isRestoringFocus}
    >
      {sortedEpisodes.map((episode, index) => (
        <VideoCard
          key={episode.id}
          video={episode.video}
          focusId={episode.id}
          outOfFocus={!isAnyEpisodeFocused && selectedEpisode?.id !== episode.id}
          topInfo={`${t('episodeLetter')}${episode.episodeNumber}`}
          hideUnwatchedThumbnail={hideUnwatchedThumbnails}
          thumbnailFallbackSrc={seasonBackgroundSrc}
          onFocus={() => {
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            setIsAnyEpisodeFocused(true);
            selectEpisode(episode);
          }}
          onBlur={() => {
            blurTimerRef.current = setTimeout(() => setIsAnyEpisodeFocused(false), 50);
          }}
          onArrowPress={(direction) => {
            if (direction === 'up') {
              setFocus(NavigationFocusKeys.details.playButton);
              return false;
            }
            if (direction === 'right' && index === sortedEpisodes.length - 1 && hasRelatedContent) {
              navigateToRelated();
              return false;
            }
            return true;
          }}
        />
      ))}
    </NavigationScrollView>
  );
}

export default EpisodesList;
