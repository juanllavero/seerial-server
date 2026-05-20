import type { DropdownContent, Video } from '@seerial/domain';
import { Pencil } from 'lucide-react';
import { useServerStore } from '@seerial/stores';
import Card from '@/shared/cards/card';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { getVideoProgress } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';

interface VideoCardProps {
  video: Video;
  title: string;
  subtitle: string;
  playVideo: (video: Video) => void;
  getVideoMenu: (video: Video) => DropdownContent;
}

function VideoCard({ video, title, subtitle, playVideo, getVideoMenu }: VideoCardProps) {
  const isMobile = useIsMobile();
  const currentUser = useServerStore((state) => state.currentUser);
  const watchList = video.watchLists?.find((list) => list.userId === currentUser?.id);

  return (
    <Card
      itemKey={video.id}
      imgSrc={video.imgSrc}
      aspectRatio={16 / 9}
      width={isMobile ? '100%' : 400}
      progress={getVideoProgress(video.runtime, watchList?.timeWatched)}
      title={title}
      subtitle={subtitle}
      action={() => playVideo(video)}
      playButtonAction={() => playVideo(video)}
      menu={getVideoMenu(video)}
      editModal={
        <Button
          variant={'ghost'}
          size={'icon'}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Pencil size={16} />
        </Button>
      }
      errorSrc="/img/Default_video_thumbnail.jpg"
    />
  );
}

export default VideoCard;
