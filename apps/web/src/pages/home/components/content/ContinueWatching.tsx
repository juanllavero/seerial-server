import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import Card from '@/components/cards/Card';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { API, authenticatedFetcher } from '@/config/api';
import type { Video } from '@/data/interfaces/Media';
import { getVideoProgress } from '@/utils/ReactUtils';
import HorizontalList from '../../../../components/lists/HorizontalList';

interface ContinueWatchingProps {
  goToContent: (url: string) => void;
}

function ContinueWatching({ goToContent }: ContinueWatchingProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Get Continue Watching items
  const { data: continueWatching, isLoading } = useSWR<Video[]>(
    API.continueWatching.getVideos,
    authenticatedFetcher,
  );

  const skeletons = Array.from({ length: 10 }, (_, index) => (
    <Skeleton
      key={`ContinueWatching ${index}`}
      className={isMobile ? 'h-39.5 min-w-70' : 'h-53.5 min-w-95'}
    />
  ));

  return (
    <HorizontalList title={t('continueWatching')}>
      {continueWatching && continueWatching.length > 0
        ? continueWatching.map((video: Video) => (
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
              playButtonAction={() => goToContent(`/video-player/${video.videoId}`)}
            />
          ))
        : isLoading
          ? skeletons
          : t('continueWatchingEmpty')}
    </HorizontalList>
  );
}

export default ContinueWatching;
