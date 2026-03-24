import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type { DetailsData } from '@seerial/domain';
import { Ellipsis, LucideBookmark, PlayIcon } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import AlignedImage from '@/components/images/AlignedImage';
import NavigationButton from '@/components/navigation/NavigationButton';
import Subtitle from '@/components/text/Subtitle';
import Tertiary from '@/components/text/Tertiary';
import Title from '@/components/text/Title';
import FlexBox from '@/components/ui/FlexBox';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

interface DetailsInfoProps {
  details: DetailsData | undefined;
  subtitle?: string;
  infoItems?: string[];
}

function DetailsInfo({ details, subtitle, infoItems }: DetailsInfoProps) {
  useKeyboardBack();
  const handleMoreOptions = useCallback(() => {}, []);

  useEffect(() => {
    setFocus(NavigationFocusKeys.details.playButton);
  }, []);

  return (
    <FlexBox direction="column" justify="end" margin="0 0 1rem 0" className="z-10">
      <span className="text-sm italic">
        {details?.tagline && details?.tagline !== '' ? details?.tagline : ''}
      </span>

      {details?.logoSrc && details?.logoSrc !== '' ? (
        <AlignedImage
          className="mt-5 pb-5"
          height={120}
          maxWidth={1000}
          imageUrl={details?.logoSrc}
        />
      ) : (
        <Title className="leading-none">{details?.title}</Title>
      )}

      {/* {title ? <Title className='leading-none'>{title}</Title> : null} */}

      {details?.subtitle && <Subtitle>{subtitle ?? details?.subtitle}</Subtitle>}

      {details?.createdBy ? (
        <span className="text-sm italic mb-5">{`Created by ${details?.createdBy}`}</span>
      ) : details?.directedBy ? (
        <span className="text-sm italic mb-5">{`Directed by ${details?.directedBy}`}</span>
      ) : null}

      <FlexBox gap={0.5} direction="column">
        {infoItems && infoItems.length > 0 ? (
          <FlexBox className="flex-row" gap={0.8}>
            {infoItems.map((item, index) => (
              <Tertiary
                key={`Info item ${
                  // biome-ignore lint/suspicious/noArrayIndexKey: <This is just display info>
                  index
                }`}
              >
                {item}
              </Tertiary>
            ))}
          </FlexBox>
        ) : null}
        {details?.score && (
          <FlexBox className="flex-row gap-3">
            <Tertiary>{details?.score.toFixed(2)}</Tertiary>
          </FlexBox>
        )}
        {details?.genres && <Tertiary>{details?.genres}</Tertiary>}
        {details?.description && (
          <FlexBox
            css={{
              maxWidth: 500,
              height: '9dvh',
              paddingTop: 3,
            }}
          >
            <Tertiary className="line-clamp-3 ellipsis">{details?.description}</Tertiary>
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
        <NavigationButton
          customKey={NavigationFocusKeys.details.playButton}
          text={'Play'}
          icon={<PlayIcon />}
          onClick={() => console.log('Play')}
        />
        <NavigationButton
          customKey={NavigationFocusKeys.details.markWatchedButton}
          text={''}
          icon={<LucideBookmark />}
          onClick={() => console.log('Mark as watched')}
        />
        <NavigationButton
          customKey={NavigationFocusKeys.details.addToMyListButton}
          text={''}
          icon={<LucideBookmark />}
          onClick={() => console.log('Add to my list')}
        />
        <NavigationButton
          customKey={NavigationFocusKeys.details.optionsButton}
          icon={<Ellipsis />}
          onClick={handleMoreOptions}
        />
      </FlexBox>
    </FlexBox>
  );
}

export default DetailsInfo;
