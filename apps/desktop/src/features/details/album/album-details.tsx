import { type Album, type DetailsData, formatDate, type LibraryType } from '@seerial/domain';
import { useGradientStore, useMusicStore } from '@seerial/stores';
import { Ellipsis, PlayIcon, Shuffle } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import { DetailsWithRelatedContent, useRelatedContent } from '@/features/details';
import AppAlertDialog from '@/shared/components/app-alert-dialog';
import BackgroundImage from '@/shared/components/backgrounds/background-image';
import DetailsInfo from '@/shared/components/details/details-info';
import { NavigationButton, NavigationScrollView } from '@/shared/components/navigation';
import Page from '@/shared/components/page';
import FlexBox from '@/shared/components/ui/flex-box';
import Image from '@/shared/components/ui/image';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import { useSettingsStore } from '@/shared/stores';
import SongsList from './components/songs-list';

interface AlbumDetailsProps {
  album: Album | undefined;
  isLoading: boolean;
  details: DetailsData | undefined;
  initialFocusedSongId?: string;
  collectionId?: string;
  libraryType?: LibraryType;
  fallbackBackgroundSrc?: string;
}

function AlbumDetails({
  album,
  isLoading,
  details,
  initialFocusedSongId,
  collectionId,
  libraryType,
  fallbackBackgroundSrc,
}: AlbumDetailsProps) {
  const navigate = useNavigate();
  const setGradientImageSrc = useGradientStore((state) => state.setGradientImageSrc);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [focusedSongId, setFocusedSongId] = useState<string | undefined>(undefined);
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

  useEffect(() => {
    const src = details?.coverSrc || album?.coverSrc || fallbackBackgroundSrc || '';
    setGradientImageSrc(src);
    return () => setGradientImageSrc('');
  }, [details?.coverSrc, album?.coverSrc, fallbackBackgroundSrc, setGradientImageSrc]);

  useEffect(() => {
    if (initialFocusedSongId) {
      setFocusedSongId(initialFocusedSongId);
    }
  }, [initialFocusedSongId]);

  return (
    <DetailsWithRelatedContent
      collectionId={collectionId}
      currentItemId={album?.id}
      currentItemType="album"
      libraryType={libraryType}
      background={
        <BackgroundImage
          imageSrc={details?.backgroundSrc ?? fallbackBackgroundSrc ?? ''}
          index={0}
        />
      }
    >
      <AlbumDetailsContent
        album={album}
        details={details}
        focusedSongId={focusedSongId}
        setFocusedSongId={setFocusedSongId}
        cardRoundness={cardRoundness}
        isErrorDialogOpen={isErrorDialogOpen}
        navigate={navigate}
      />
    </DetailsWithRelatedContent>
  );
}

interface AlbumDetailsContentProps {
  album: Album | undefined;
  details: DetailsData | undefined;
  focusedSongId: string | undefined;
  setFocusedSongId: (id: string | undefined) => void;
  cardRoundness: string;
  isErrorDialogOpen: boolean;
  navigate: ReturnType<typeof useNavigate>;
}

function AlbumDetailsContent({
  album,
  details,
  focusedSongId,
  setFocusedSongId,
  cardRoundness,
  isErrorDialogOpen,
  navigate,
}: AlbumDetailsContentProps) {
  const { navigateToRelated, hasRelatedContent } = useRelatedContent();
  const miniPlayerActive = useMusicStore((state) => state.isShown && !state.isExpanded);

  return (
    <Page padding="0" justify="end" fullScreen>
      <FlexBox padding="0" height={'100%'} width={'100%'} gap={2} className="z-10">
        <FlexBox height={'100%'} width={'40vw'} justify="end" padding="10dvh 0">
          <Image
            url={details?.coverSrc ?? album?.coverSrc ?? ''}
            className={cardRoundness}
            width="60vh"
            height="60vh"
          />
        </FlexBox>
        <NavigationScrollView
          direction="vertical"
          scrollMode="center"
          className="w-[55vw] max-w-dvh max-h-screen pt-[10vh] pb-[10vh]"
          focusedElementId={focusedSongId}
          isFocusBoundary
          focusBoundaryDirections={miniPlayerActive ? [] : ['up']}
          isRestoringFocus={false}
        >
          <DetailsInfo
            details={details}
            infoItems={[formatDate(details?.year ?? album?.year ?? '')]}
            displayOptions={{
              hideButtons: true,
            }}
          />

          <FlexBox gap={1} padding="0 4rem" className="pt-[3dvh]!">
            <NavigationButton
              customKey={NavigationFocusKeys.details.playButton}
              text={'Reproducir'}
              icon={<PlayIcon fill="currentColor" size={'3dvh'} />}
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
              onArrowPress={(direction) => {
                if (direction === 'right' && hasRelatedContent) {
                  navigateToRelated();
                  return false;
                }
                return true;
              }}
            />
          </FlexBox>

          {!!album && (
            <SongsList
              album={album}
              songs={album.songs ?? []}
              focusedSongId={focusedSongId}
              onSongFocus={setFocusedSongId}
              onNavigateToRelated={hasRelatedContent ? navigateToRelated : undefined}
            />
          )}
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
