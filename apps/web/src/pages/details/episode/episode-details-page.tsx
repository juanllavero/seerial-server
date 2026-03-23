import { API, useGet } from '@seerial/api';
import type { Episode, Season, Series } from '@seerial/domain';
import { formatDate } from '@seerial/domain';
import { useIsAdmin } from '@seerial/hooks';
import { Pencil, PlayIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { useDialogStore } from '@/features/management';
import { VideoTracks } from '@/features/media-details';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import LazyImage from '@/shared/ui/lazy-image';
import { Skeleton } from '@/shared/ui/skeleton';

function EpisodeDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openDialog } = useDialogStore((state) => ({ openDialog: state.openDialog }), shallow);
  const { episodeId } = useParams();
  const isAdmin = useIsAdmin();

  // Get episode data
  const {
    data: episode,
    isLoading,
    mutate,
  } = useGet<Episode>(episodeId ? API.episodes.get(episodeId) : '');

  const { data: season } = useGet<Season>(episode ? API.seasons.get(episode.seasonId) : '');

  const { data: series } = useGet<Series>(season ? API.series.get(season.seriesId) : '');

  if (isLoading) {
    return <Skeleton className="h-100 w-100" />;
  }

  if (!episode) {
    return null;
  }

  return (
    <FlexBox className="details-container" gap={2} wrap="nowrap" padding="3rem" height={'100%'}>
      <FlexBox direction="column" gap={1}>
        <LazyImage
          url={episode.video.imgSrc}
          width={500}
          maxHeight={300}
          height={300}
          errorSrc={'/img/Default_video_thumbnail.jpg'}
        />

        <VideoTracks video={episode?.video} mutate={mutate} />
      </FlexBox>

      <FlexBox direction="column" gap={1}>
        <FlexBox direction="column">
          <Link
            to={`/series/${series?.id}`}
            className="a_text cursor-pointer text-4xl font-black uppercase"
          >
            {series ? series.name : 'None'}
          </Link>
          <span className="text-2xl font-semibold">{episode.name}</span>
        </FlexBox>
        <FlexBox gap={1}>
          <span>
            {t('seasonLetter')}
            {episode.seasonNumber}
            {' · '}
            {t('episodeLetter')}
            {episode.episodeNumber}
          </span>
          <span>{formatDate(episode.year)}</span>
          <span>{episode.video.runtime.toFixed()}min</span>
        </FlexBox>
        <span className="w-[80%] max-w-300">{episode.overview}</span>

        <Button
          onClick={async () => {
            if (!episode.video?.id) {
              return;
            }

            navigate(`/video-player/${episode.video.id}`);
          }}
        >
          <FlexBox align="center" gap={0.5} className="text-black">
            <PlayIcon color="#111111" />
            {t('playButton')}
          </FlexBox>
        </Button>

        {isAdmin && (
          <Button
            variant={'ghost'}
            title={t('editButton')}
            onClick={() => {
              if (season) {
                openDialog('episode', { id: season.id });
              }
            }}
          >
            <Pencil />
          </Button>
        )}
      </FlexBox>
    </FlexBox>
  );
}

export default EpisodeDetailsPage;
