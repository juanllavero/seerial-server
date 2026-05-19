import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import type { Video } from '@seerial/domain';
import { useNavigate } from 'react-router';
import Image from '@/shared/components/ui/image';
import { useSettingsStore } from '@/shared/stores';
import { memo } from 'react';
import { Check } from 'lucide-react';
import { useServerStore } from '@seerial/stores';
import { shallow } from 'zustand/shallow';

interface VideoCardProps {
  video: Video;
  focusId?: string;
  outOfFocus?: boolean;
  onFocus?: () => void;
  onArrowPress?: (direction: string) => boolean | undefined;
}

function VideoCard({ video, focusId, outOfFocus, onFocus, onArrowPress }: VideoCardProps) {
  const navigate = useNavigate();
  const { currentUser } = useServerStore(
    (state) => ({
      currentUser: state.currentUser,
    }),
    shallow,
  );
  const { cardRoundness } = useSettingsStore((state) => ({
    cardRoundness: state.settings.cardRoundness,
  }));
  const { ref, focused } = useFocusable({
    focusKey: focusId,
    onFocus: () => onFocus?.(),
    onEnterPress: handlePlay,
    onArrowPress: onArrowPress ? (direction) => onArrowPress(direction) ?? true : undefined,
  });

  function handlePlay() {
    navigate(`/video-player/${video.id}`);
  }

  const isVideoWatched = video.watchLists.some(
    (watchList) => watchList.userId === currentUser?.id && watchList.watched,
  );

  return (
    <div
      ref={ref}
      data-focus-key={focusId}
      className={`relative shrink-0 p-0 ${outOfFocus && focusId !== video.id ? 'opacity-50' : ''}
      ${cardRoundness} scale-95 border-2 border-transparent transition-all duration-350 ${focused ? 'transform scale-100 border-white' : ''}`}
      style={{
        height: '22vh',
      }}
    >
      <Image
        url={video.imgSrc}
        height="100%"
        width="100%"
        className={`h-full w-full ${cardRoundness}`}
        aspectRatio="16/9"
      />

      {isVideoWatched && (
        <div className="absolute top-2 right-2 bg-black/70 rounded-2xl">
          <Check size={24} />
        </div>
      )}
    </div>
  );
}

export default memo(VideoCard);
