import type { DropdownContent, Episode, WatchList } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '@/shared/cards/card';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { getVideoProgress } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';

interface EpisodeCardDetailsProps {
  episode: Episode;
  playEpisode: (episode: Episode) => void;
  goToDetails: (episode: Episode) => void;
  getEpisodeMenu: (episode: Episode) => DropdownContent;
  editEpisode: (episode: Episode) => void;
}

function EpisodeCardDetails({
  episode,
  playEpisode,
  goToDetails,
  getEpisodeMenu,
  editEpisode,
}: EpisodeCardDetailsProps) {
  const user = useServerStore((state) => state.currentUser);
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const watchedList = episode.video.watchLists.find((list: WatchList) => list.userId === user?.id);

  const timeWatched = watchedList?.timeWatched ?? 0;

  return (
    <FlexBox justify="start" align="center" gap={1} width={'100%'}>
      <div className="w-[40%] max-w-100 min-w-30">
        <Card
          itemKey={episode.id}
          imgSrc={episode.video?.imgSrc}
          aspectRatio={16 / 9}
          width={'100%'}
          progress={getVideoProgress(episode.video, timeWatched)}
          title={''}
          watched={watchedList && timeWatched < episode.video.runtime * 0.9}
          subtitle={''}
          action={() => goToDetails(episode)}
          playButtonAction={() => playEpisode(episode)}
          menu={getEpisodeMenu(episode)}
          editModal={
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={(e) => {
                e.stopPropagation();
                editEpisode(episode);
              }}
            >
              <Pencil size={16} />
            </Button>
          }
          errorSrc="/img/Default_video_thumbnail.jpg"
        />
      </div>
      <FlexBox direction="column" width={'80%'}>
        <span className={`${isMobile ? 'text-sm' : ''} font-semibold`}>{episode.name}</span>
        <span
          className={`mb-${isMobile ? '1' : '3'} ${isMobile ? 'text-sm' : ''}`}
        >{`${t('episode')} ${episode.episodeNumber.toString()}`}</span>
        <span className={`line-clamp-${isMobile ? '2' : '4'} text-sm`}>{episode.overview}</span>
      </FlexBox>
    </FlexBox>
  );
}

export default EpisodeCardDetails;
