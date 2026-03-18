import type { DropdownContent, Episode, WatchList } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import Card from '@/shared/cards/card';
import { useCardWidth } from '@/shared/hooks/use-card-width';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import { getVideoProgress } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';

interface EpisodeCardProps {
  episode: Episode;
  playEpisode: (episode: Episode) => void;
  goToDetails: (episode: Episode) => void;
  getEpisodeMenu: (episode: Episode) => DropdownContent;
  editEpisode: (episode: Episode) => void;
}

function EpisodeCard({
  episode,
  goToDetails,
  playEpisode,
  getEpisodeMenu,
  editEpisode,
}: EpisodeCardProps) {
  const user = useServerStore((state) => state.currentUser);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { cardWidth } = useCardWidth();

  const watchedList = episode.video.watchLists.find((list: WatchList) => list.userId === user?.id);

  const timeWatched = watchedList?.timeWatched ?? 0;

  return (
    <Card
      itemKey={episode.id}
      imgSrc={episode.video?.imgSrc}
      aspectRatio={16 / 9}
      width={isMobile || isTablet ? '100%' : cardWidth * 2.2}
      progress={getVideoProgress(episode.video, timeWatched)}
      title={episode.name}
      watched={watchedList && timeWatched < episode.video.runtime * 0.9}
      subtitle={`${t('episode')} ${episode.episodeNumber.toString()}`}
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
  );
}

export default EpisodeCard;
