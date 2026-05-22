import type { CastData } from '@seerial/domain';
import { NavigationButton } from '@/shared/components/navigation';
import Image from '@/shared/components/ui/image';
import Tertiary from '../text/tertiary';

interface DetailsCastCardProps {
  person: CastData;
  focusKey: string;
  onFocused?: (focusKey: string) => void;
  isSelected?: boolean;
}

function DetailsCastCard({
  person,
  focusKey,
  onFocused,
  isSelected = false,
}: DetailsCastCardProps) {
  return (
    <NavigationButton
      customKey={focusKey}
      onFocus={() => onFocused?.(focusKey)}
      variant="ghost"
      className={`h-[25dvh] w-[25dvh] shrink-0 rounded-xl! bg-transparent! p-0! max-h-none! whitespace-normal!`}
    >
      <div className="flex flex-col items-center gap-2">
        <Image
          url={person.profileImage}
          fallbackSrc="/img/fileNotFound.jpg"
          alt={person.name}
          width="15dvh"
          height="15dvh"
          aspectRatio="1"
          className={`border-2 border-transparent rounded-full transition-transform duration-300! ease-in-out ${isSelected ? 'scale-100 border-white' : 'scale-90'}`}
          objectFit="cover"
          tmdbSize="w185"
        />
        <Tertiary className="line-clamp-1 w-full text-center" style={{ color: 'white' }}>
          {person.name}
        </Tertiary>
        <Tertiary
          className="line-clamp-2! w-full text-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          {person.character}
        </Tertiary>
      </div>
    </NavigationButton>
  );
}

export default DetailsCastCard;
