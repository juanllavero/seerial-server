import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import type { Video } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { Check } from 'lucide-react';
import { memo } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import Image from '@/shared/components/ui/image';
import { useSettingsStore } from '@/shared/stores';
import Tertiary from '../text/tertiary';

interface VideoCardProps {
  video: Video;
  focusId?: string;
  outOfFocus?: boolean;
  topInfo?: string;
  hideUnwatchedThumbnail?: boolean;
  thumbnailFallbackSrc?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onArrowPress?: (direction: string) => boolean | undefined;
}

function VideoCard({
  video,
  focusId,
  outOfFocus,
  topInfo,
  hideUnwatchedThumbnail,
  thumbnailFallbackSrc,
  onFocus,
  onBlur,
  onArrowPress,
}: VideoCardProps) {
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
    onBlur: () => onBlur?.(),
    onEnterPress: handlePlay,
    onArrowPress: onArrowPress ? (direction) => onArrowPress(direction) ?? true : undefined,
  });

  function handlePlay() {
    navigate(`/video-player/${video.id}`);
  }

  const isVideoWatched = video.watchLists.some(
    (watchList) => watchList.userId === currentUser?.id && watchList.watched,
  );

  const imageSrc = hideUnwatchedThumbnail && !isVideoWatched ? thumbnailFallbackSrc : video.imgSrc;

  return (
    <div
      ref={ref}
      data-focus-key={focusId}
      className={`relative shrink-0 p-0 ${outOfFocus ? 'opacity-50' : ''}
      ${cardRoundness} scale-95 border-2 border-transparent transition-all duration-350 ${focused ? 'transform scale-100 border-white' : ''}`}
      style={{
        height: '22vh',
      }}
    >
      <Image
        url={imageSrc}
        height="100%"
        width="100%"
        className={`h-full w-full ${cardRoundness}`}
        aspectRatio="16/9"
      />
      {topInfo && (
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/70 rounded-lg px-2 py-1 text-sm">
          {isVideoWatched && <Check strokeWidth={3} size={24} />}
          <Tertiary>{topInfo}</Tertiary>
        </div>
      )}
    </div>
  );
}

export default memo(VideoCard);
