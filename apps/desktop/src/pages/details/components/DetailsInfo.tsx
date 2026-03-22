import { Ellipsis, LucideBookmark, PlayIcon } from 'lucide-react';
import { useCallback } from 'react';
import AlignedImage from '@/components/images/AlignedImage';
import NavigationButton from '@/components/navigation/NavigationButton';
import Subtitle from '@/components/text/Subtitle';
import Tertiary from '@/components/text/Tertiary';
import Title from '@/components/text/Title';
import FlexBox from '@/components/ui/FlexBox';

interface DetailsInfoProps {
  title?: string;
  logoUrl?: string;
  subtitle?: string;
  tagline?: string;
  score?: number;
  genres?: string[];
  createdBy?: string[];
  directedBy?: string[];
  infoItems?: string[];
  overview?: string;
}

function DetailsInfo({
  title,
  logoUrl,
  subtitle,
  tagline,
  score,
  genres,
  createdBy,
  directedBy,
  infoItems,
  overview,
}: DetailsInfoProps) {
  const handleMoreOptions = useCallback(() => {}, []);

  return (
    <FlexBox
      direction="column"
      justify="end"
      margin="0 0 1rem 0"
      className="z-10"
      // css={{
      // 	height: 380,
      // }}
    >
      <span className="text-sm italic">{tagline && tagline !== '' ? tagline : ''}</span>

      {logoUrl && logoUrl !== '' ? (
        <AlignedImage className="mt-5 pb-5" height={120} maxWidth={1000} imageUrl={logoUrl} />
      ) : (
        <Title className="leading-none">{title}</Title>
      )}

      {/* {title ? <Title className='leading-none'>{title}</Title> : null} */}

      {subtitle && <Subtitle>{subtitle}</Subtitle>}

      {directedBy && (
        <span className="text-sm italic mb-5">{`Directed by ${directedBy.join(', ')}`}</span>
      )}

      {createdBy && (
        <span className="text-sm italic mb-5">{`Created by ${createdBy.join(', ')}`}</span>
      )}

      <FlexBox gap={0.5} direction="column">
        {infoItems && infoItems.length > 0 ? (
          <FlexBox className="flex-row" gap={0.8}>
            {infoItems.map((item, index) => (
              <Tertiary key={`Info item ${index}`}>{item}</Tertiary>
            ))}
          </FlexBox>
        ) : null}
        {score && (
          <FlexBox className="flex-row gap-3">
            <Tertiary>{score.toFixed(2)}</Tertiary>
          </FlexBox>
        )}
        {genres && <Tertiary>{genres.join(', ')}</Tertiary>}
        {overview && (
          <FlexBox
            css={{
              maxWidth: 500,
              height: '9dvh',
              paddingTop: 3,
            }}
          >
            <Tertiary className="line-clamp-3 ellipsis">{overview}</Tertiary>
          </FlexBox>
        )}
      </FlexBox>

      <FlexBox
        gap={1}
        // css={{
        // 	justifyContent: 'flex-start',
        // 	paddingTop: 15,
        // 	gap: 10,
        // }}
      >
        <NavigationButton text={'Play'} icon={<PlayIcon />} onClick={() => console.log('Play')} />
        <NavigationButton
          text={''}
          icon={<LucideBookmark />}
          onClick={() => console.log('Mark as watched')}
        />
        <NavigationButton icon={<Ellipsis />} onClick={handleMoreOptions} />
      </FlexBox>
    </FlexBox>
  );
}

export default DetailsInfo;
