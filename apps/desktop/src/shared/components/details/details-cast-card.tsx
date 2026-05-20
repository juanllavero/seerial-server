import type { CastData } from '@seerial/domain';
import { NavigationButton } from '@/shared/components/navigation';
import FlexBox from '@/shared/components/ui/flex-box';
import Image from '@/shared/components/ui/image';
import { Tertiary } from '../text';

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
      className={`h-[22dvh] w-[20dvh] shrink-0 rounded-xl! bg-black/35 p-3! text-left justify-start! max-h-none! border-2 ${
        isSelected ? 'border-white' : 'border-transparent'
      }`}
    >
      <FlexBox direction="column" gap={0.8} align="center">
        <Image
          url={person.profileImage}
          fallbackSrc="/img/fileNotFound.jpg"
          alt={person.name}
          width="9dvh"
          height="9dvh"
          aspectRatio="1"
          className="rounded-full"
          objectFit="cover"
          tmdbSize="w185"
        />
        <Tertiary
          className="line-clamp-1 w-full text-center"
          style={{ color: 'var(--text-primary)' }}
        >
          {person.name}
        </Tertiary>
        <Tertiary
          className="line-clamp-2 w-full text-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          {person.character}
        </Tertiary>
      </FlexBox>
    </NavigationButton>
  );
}

export default DetailsCastCard;
