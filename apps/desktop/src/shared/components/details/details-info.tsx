import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type { DetailsData } from '@seerial/domain';
import { Ellipsis, LucideBookmark, PlayIcon, Subtitles, Volume2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import AlignedImage from '@/components/images/AlignedImage';
import NavigationButton from '@/components/navigation/NavigationButton';
import Subtitle from '@/components/text/Subtitle';
import Tertiary from '@/components/text/Tertiary';
import Title from '@/components/text/Title';
import { Card } from '@/components/ui/card';
import FlexBox from '@/components/ui/FlexBox';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

interface DetailsInfoProps {
  details: DetailsData | undefined;
  subtitle?: string;
  infoItems?: string[];
  handlePlay?: () => void;
  bigLogo?: boolean;
  videoInfo?: string;
  audioInfo?: string;
  subtitleInfo?: string;
  hideButtons?: boolean;
}

function DetailsInfo({
  details,
  subtitle,
  infoItems,
  handlePlay,
  bigLogo,
  videoInfo,
  audioInfo,
  subtitleInfo,
  hideButtons,
}: DetailsInfoProps) {
  useKeyboardBack();

  useEffect(() => {
    setFocus(NavigationFocusKeys.details.playButton);
  }, []);

  const handleMoreOptions = useCallback(() => {}, []);

  return (
    <FlexBox direction="column" justify="end" width={'100%'} className="z-10">
      <span className="text-[1.5vh] italic">
        {details?.tagline && details?.tagline !== '' ? details?.tagline : ''}
      </span>

      {details?.logoSrc && details?.logoSrc !== '' ? (
        <AlignedImage
          className="mt-5 pb-5"
          height={bigLogo ? 300 : 120}
          maxWidth={1100}
          imageUrl={details?.logoSrc}
        />
      ) : (
        <Title className="leading-none">{details?.title}</Title>
      )}

      {details?.subtitle && <Subtitle>{subtitle ?? details?.subtitle}</Subtitle>}

      {details?.createdBy ? (
        <span className="text-[1.5vh] italic mb-5">{`Created by ${details?.createdBy}`}</span>
      ) : details?.directedBy ? (
        <span className="text-[1.5vh] italic mb-5">{`Directed by ${details?.directedBy}`}</span>
      ) : null}

      <FlexBox gap={0.8} direction="column">
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
        {details?.imdbScore && details.imdbScore !== -1 ? (
          <FlexBox className="flex-row space-x-3">
            <Tertiary>{details?.imdbScore.toFixed(2)}</Tertiary>
            <img src="/img/logos/imdb.png" alt="IMDb Logo" className="self-center max-h-[2vh]" />
          </FlexBox>
        ) : details?.score ? (
          <FlexBox className="flex-row space-x-3">
            <Tertiary>{details?.score.toFixed(2)}</Tertiary>
            <img
              src="/svg/themoviedb.svg"
              alt="The Movie Database Logo"
              className="self-center max-h-[2vh]"
            />
          </FlexBox>
        ) : null}
        {details?.genres && <Tertiary>{details?.genres}</Tertiary>}
        {details?.description && (
          <FlexBox
            css={{
              maxWidth: 1000,
              height: hideButtons ? '8dvh' : '12dvh',
              paddingTop: 3,
            }}
          >
            <Tertiary className={`${hideButtons ? 'line-clamp-3' : 'line-clamp-4'} ellipsis`}>
              {details?.description}
            </Tertiary>
          </FlexBox>
        )}
      </FlexBox>

      {!hideButtons && (
        <FlexBox
          className="flex-row"
          width={'100%'}
          justify="space-between"
          align="center"
          css={{
            paddingTop: 50,
            gap: 10,
          }}
        >
          <FlexBox gap={1}>
            <NavigationButton
              customKey={NavigationFocusKeys.details.playButton}
              text={'Reproducir'}
              icon={<PlayIcon size={'3dvh'} />}
              onClick={handlePlay}
              hideText
              animateText
            />
            <NavigationButton
              customKey={NavigationFocusKeys.details.markWatchedButton}
              text={'Marcar como visto'}
              icon={<LucideBookmark size={'3vh'} />}
              onClick={() => console.log('Mark as watched')}
              hideText
              animateText
            />
            <NavigationButton
              customKey={NavigationFocusKeys.details.addToMyListButton}
              text={'Agregar a mi lista'}
              icon={<LucideBookmark size={'3dvh'} />}
              onClick={() => console.log('Add to my list')}
              hideText
              animateText
            />
            <NavigationButton
              customKey={NavigationFocusKeys.details.optionsButton}
              icon={<Ellipsis size={'3dvh'} />}
              onClick={handleMoreOptions}
              hideText
              animateText
            />
          </FlexBox>

          {(videoInfo || audioInfo || subtitleInfo) && (
            <FlexBox direction="row" gap={2}>
              {videoInfo && (
                <Card className="px-3 border-none">
                  <Tertiary>{videoInfo}</Tertiary>
                </Card>
              )}
              {audioInfo && (
                <Card className="px-3 border-none flex items-center gap-3">
                  <Volume2 />
                  <Tertiary>{audioInfo}</Tertiary>
                </Card>
              )}
              {subtitleInfo && (
                <Card className="px-3 border-none flex items-center gap-3">
                  <Subtitles />
                  <Tertiary>{subtitleInfo}</Tertiary>
                </Card>
              )}
            </FlexBox>
          )}
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default DetailsInfo;
