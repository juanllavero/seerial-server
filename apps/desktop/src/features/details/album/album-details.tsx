import { type Album, type DetailsData, formatDate } from '@seerial/domain';
import { Ellipsis, PlayIcon, Shuffle } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import BackgroundImage from '@/components/backgrounds/BackgroundImage';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationScrollView from '@/components/navigation/NavigationScrollView';
import FlexBox from '@/components/ui/FlexBox';
import Image from '@/components/ui/Image';
import { useSettingsStore } from '@/features/settings/stores/settings.store';
import AppAlertDialog from '@/shared/components/app-alert-dialog';
import DetailsInfo from '@/shared/components/details/details-info';
import Page from '@/shared/components/page';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import SongsList from './components/songs-list';

interface AlbumDetailsProps {
  album: Album | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
}

function AlbumDetails({ album, isLoading, details }: AlbumDetailsProps) {
  const navigate = useNavigate();
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [focusedSongId, setFocusedSongId] = useState<string | undefined>();
  const { cardRoundness } = useSettingsStore(
    (s) => ({
      cardRoundness: s.settings.cardRoundness,
    }),
    shallow,
  );

  useEffect(() => {
    if (!isLoading && !album) {
      setIsErrorDialogOpen(true);
    }
  }, [album, isLoading]);

  return (
    <Page padding="0" justify="end">
      <GradientBackground imageSrc={details?.coverSrc ?? album?.coverSrc ?? ''} index={0} />
      <BackgroundImage imageSrc={details?.backgroundSrc ?? ''} index={0} />

      <FlexBox padding="4rem 0 0 0" height={'100%'} width={'100%'} className="z-10">
        <FlexBox height={'100%'} width={'40vw'} justify="end">
          <Image
            url={details?.coverSrc ?? album?.coverSrc ?? ''}
            className={cardRoundness}
            width="60vh"
            height="60vh"
          />
        </FlexBox>
        <NavigationScrollView direction="vertical" scrollMode='center' className="gap-8 w-[50vw] max-h-screen pb-100" focusedElementId={focusedSongId} isFocusBoundary focusBoundaryDirections={['up']} isRestoringFocus={false}>
          <DetailsInfo
            details={details}
            infoItems={[formatDate(details?.year ?? album?.year ?? '')]}
            hideButtons
          />

          <FlexBox gap={1} padding="0 4rem">
            <NavigationButton
              customKey={NavigationFocusKeys.details.playButton}
              text={'Reproducir'}
              icon={<PlayIcon size={'3dvh'} />}
              hideText
              animateText
            />
            <NavigationButton
              customKey={NavigationFocusKeys.details.markWatchedButton}
              text={'Marcar como visto'}
              icon={<Shuffle size={'3vh'} />}
              onClick={() => console.log('Mark as watched')}
              hideText
              animateText
            />
            <NavigationButton
              customKey={NavigationFocusKeys.details.optionsButton}
              icon={<Ellipsis size={'3dvh'} />}
              hideText
              animateText
            />
          </FlexBox>

          {!!album && <SongsList album={album} songs={album.songs ?? []} onSongFocus={setFocusedSongId} />}
        </NavigationScrollView>
      </FlexBox>

      {/* Selected Album Songs */}

      <AppAlertDialog
        open={isErrorDialogOpen}
        subtitle={'The album details could not be loaded. Please try again later.'}
        title="Album not found"
        primaryAction={{
          label: 'Go back',
          onPress: () => navigate(-1),
        }}
      />
    </Page>
  );
}

export default memo(AlbumDetails);
