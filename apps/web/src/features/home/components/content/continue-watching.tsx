import { useGetContinueWatching } from '@seerial/api';
import type { Video } from '@seerial/domain';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { getVideoProgress } from '@/shared/lib/react-utils';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import HorizontalList from '../../../../shared/lists/horizontal-list';

type ContinueWatchingVideo = Video & {
  subtitle?: string;
  date?: string;
  seasonNumber?: number;
  episodeNumber?: number;
};

interface ContinueWatchingProps {
  goToContent: (url: string) => void;
}

function ContinueWatching({ goToContent }: ContinueWatchingProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Get Continue Watching items
  const { data: continueWatching, isLoading } = useGetContinueWatching<ContinueWatchingVideo[]>();

  const skeletonIds = Array.from({ length: 10 }, (_value, i) => `ContinueWatching-${i}`);

  const skeletons = skeletonIds.map((id) => (
    <Skeleton key={id} className={isMobile ? 'h-39.5 min-w-70' : 'h-53.5 min-w-95'} />
  ));

  return (
    <HorizontalList title={t('continueWatching')}>
      {continueWatching && continueWatching.length > 0
        ? continueWatching.map((video: ContinueWatchingVideo) => (
            <Card
              key={`Home Card ${video.id}`}
              itemKey={`Home Card ${video.id}`}
              imgSrc={video.imgSrc}
              aspectRatio={16 / 9}
              width={isMobile ? 280 : 380}
              hideButtons
              progress={getVideoProgress(video)}
              title={`${video.title}`}
              subtitle={`${video.subtitle ? `${video.subtitle} - ` : video.date ? video.date.split('-')[0] : ''} ${
                video.seasonNumber && video.episodeNumber
                  ? `${t('seasonLetter')}${video.seasonNumber} ${t('episodeLetter')}${
                      video.episodeNumber
                    }`
                  : ''
              }`}
              action={() =>
                goToContent(
                  `/${video.episodeId ? 'episode' : 'movie'}/${video.episodeId ? video.episodeId : video.movieId}`,
                )
              }
              playButtonAction={() => goToContent(`/video-player/${video.id}`)}
            />
          ))
        : isLoading
          ? skeletons
          : t('continueWatchingEmpty')}
    </HorizontalList>
  );
}

export default ContinueWatching;
