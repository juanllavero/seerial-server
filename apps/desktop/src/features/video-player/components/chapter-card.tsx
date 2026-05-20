import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import type { Chapter } from '@seerial/domain';
import Image from '@/shared/components/ui/image';
import { useSettingsStore } from '@/shared/stores';

interface ChapterCardProps {
  chapter: Chapter;
  isActive: boolean;
  focusKey: string;
  onEnterPress: () => void;
  onFocus: () => void;
}

function ChapterCard({ chapter, isActive, focusKey, onEnterPress, onFocus }: ChapterCardProps) {
  const { cardRoundness } = useSettingsStore((state) => ({
    cardRoundness: state.settings.cardRoundness,
  }));

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress,
    onFocus,
  });

  return (
    <div
      ref={ref}
      className={`shrink-0 flex flex-col overflow-hidden transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'} ${focused ? 'opacity-100' : ''}`}
      style={{ width: '22vh' }}
    >
      <div
        className={`relative w-full overflow-hidden ${cardRoundness} border-2 transition-all duration-300 ${focused ? 'scale-100 border-white' : 'scale-95 border-transparent'}`}
        style={{ aspectRatio: '16/9' }}
      >
        <Image
          url={chapter.thumbnailSrc || undefined}
          width="100%"
          height="100%"
          className={`h-full w-full ${cardRoundness}`}
          aspectRatio="16/9"
        />
      </div>
      <div className="flex scale-95 flex-col pt-1 overflow-hidden min-h-0">
        <span className="truncate text-[1.5vh] leading-tight text-white">{chapter.title}</span>
        <span
          className="truncate text-[1.25vh] leading-tight"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          {chapter.displayTime}
        </span>
      </div>
    </div>
  );
}

export default ChapterCard;
