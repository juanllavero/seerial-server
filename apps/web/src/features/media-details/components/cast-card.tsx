import type { CastData as Cast } from '@seerial/domain';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import FlexBox from '@/shared/ui/flex-box';

interface CastCardProps {
  index: string | number;
  person: Cast;
}

function CastCard({ index, person }: CastCardProps) {
  const isMobile = useIsMobile();
  return (
    <FlexBox
      direction="column"
      gap={0.5}
      justify="center"
      align="center"
      className="text-center"
      key={'Cast Person ' + index}
      padding="1rem"
    >
      {/* <Image
        src={person.profileImage}
        aspectRatio={1}
        width={isMobile ? 25 : 40}
        fallbackSrc="local/img/castDefault.png"
        className={`aspect-square w-${isMobile ? '25' : '40'} h-${isMobile ? '25' : '40'} rounded-full`}
        alt={person.name}
      /> */}
      <div
        className={`aspect-square bg-white w-${isMobile ? '25' : '40'} h-${isMobile ? '25' : '40'} rounded-full`}
      />
      <span className={isMobile ? 'text-xs' : ''}>{person.name}</span>
      <span className={isMobile ? 'text-xs' : 'text-sm'} style={{ color: 'lightgray' }}>
        {person.character}
      </span>
    </FlexBox>
  );
}

export default CastCard;
