import type { DropdownContent, Episode, WatchList } from '@seerial/domain';
import { getVideoProgressss } from '@seeriadomainin';
import { useServerStoreseServerS@seerial/storesfrom '@seerial/stores';
import { tom 'i18nei18next
import { Pencil }ncil } lucide-react;
import Cardred/cards/card';cards
import { useCardWidthh } from '@/shared/hooks/usecard-widthwidth';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useIsTabletom '@/sharsshared/hooks/use-tabletablet';
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
