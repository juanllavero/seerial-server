import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetContinueWatching } from '@seerial/api';
import { type ContinueWatchingVideoDTO, formatDate } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import NavigationScrollView from '@/components/navigation/NavigationScrollView';
import ListTitle from '@/components/text/ListTitle';
import Subtitle from '@/components/text/Subtitle';
import Title from '@/components/text/Title';
import HomeHeroImage from '@/pages/home/components/home-hero-image';
import AppAlertDialog from '@/shared/components/app-alert-dialog';
import DetailsInfo from '@/shared/components/details/details-info';
import Loading from '@/shared/components/loading';
import Page from '@/shared/components/page';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import ContentCard from '@/shared/ui/card';

function getSelectedInfoItems(selectedElement: ContinueWatchingVideoDTO | null) {
  if (!selectedElement) {
    return [];
  }

  const episodeCode = selectedElement.episodeNumber
    ? `S${selectedElement.seasonNumber}E${selectedElement.episodeNumber}`
    : undefined;
  const releaseDate = selectedElement.episodeId
    ? formatDate(selectedElement.date ?? '')
    : selectedElement.date.split('-')[0];
  const remainingMinutes = `${(selectedElement.duration - selectedElement.timeWatched / 60).toFixed(0)} minutes remaining`;

  return [episodeCode, releaseDate, remainingMinutes].filter(Boolean) as string[];
}

function renderContinueWatchingContent({
  continueWatching,
  isLoading,
  selectedElement,
  navigate,
  setSelectedElement,
  t,
}: {
  continueWatching: ContinueWatchingVideoDTO[] | undefined;
  isLoading: boolean;
  selectedElement: ContinueWatchingVideoDTO | null;
  navigate: ReturnType<typeof useNavigate>;
  setSelectedElement: React.Dispatch<React.SetStateAction<ContinueWatchingVideoDTO | null>>;
  t: (key: string) => string;
}) {
  if (continueWatching && continueWatching.length > 0) {
    return continueWatching.map((element: ContinueWatchingVideoDTO) => (
      <ContentCard
        key={element.id}
        imgSrc={element.posterImage ?? ''}
        customKey={element.id}
        width={'26dvh'}
        noInfo
        onFocus={() => setSelectedElement(element)}
        aspectRatio="2/3"
        action={() => {
          if (element.id === selectedElement?.id) {
            navigate(
              `/details/${element.seriesId ? 'series' : 'movie'}/${element.seriesId ? element.seriesId : element.movieId}`,
              {
                state: { cachedDetails: element.details },
              },
            );
          } else {
            setSelectedElement(element);
          }
        }}
        duration={element.duration}
        timeWatched={element.timeWatched}
      />
    ));
  }

  if (isLoading) {
    return t('noContent');
  }

  return <Loading />;
}

function Home() {
  const { currentUser } = useServerStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedServer } = useServerStore();
  const serverUrl = selectedServer?.url ?? '';
  const [selectedElement, setSelectedElement] = useState<ContinueWatchingVideoDTO | null>(null);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  useKeyboardBack({
    preAction: () => setIsExitDialogOpen(true),
    navigateOnBack: false,
  });

  //Get Continue Watching items
  const { data: continueWatching, isLoading } = useGetContinueWatching<ContinueWatchingVideoDTO[]>({
    enabled: !!selectedServer && !!serverUrl && !!currentUser?.id,
    params: currentUser?.id ? { userId: currentUser.id } : undefined,
  });

  useEffect(() => {
    if (continueWatching && continueWatching.length > 0)
      setFocus(`continueWatchingCard-${continueWatching[0].id}`);
  }, [continueWatching]);

  useEffect(() => {
    if (continueWatching && continueWatching.length > 0) {
      setSelectedElement(continueWatching[0]);
      setFocus(`${continueWatching[0].id}`);
    } else {
      setSelectedElement(null);
      setFocus('home');
    }
  }, [continueWatching]);

  const imageSrc = selectedElement?.backgroundImage ?? selectedElement?.posterImage;

  const handleCancelExit = () => {
    setIsExitDialogOpen(false);

    if (selectedElement) {
      setFocus(selectedElement.id);
      return;
    }

    setFocus('home');
  };

  const handleConfirmExit = async () => {
    await invoke('exit_app');
  };

  const infoItems = getSelectedInfoItems(selectedElement);
  const continueWatchingContent = renderContinueWatchingContent({
    continueWatching,
    isLoading,
    selectedElement,
    navigate,
    setSelectedElement,
    t,
  });

  if (!continueWatching || continueWatching.length === 0) {
    return (
      <Page justify="center" align="center">
        <Title>No tienes contenido en progreso</Title>
        <Subtitle>Empieza a ver algo para que aparezca aquí</Subtitle>
      </Page>
    );
  }

  return (
    <Page justify="end">
      <AppAlertDialog
        open={isExitDialogOpen}
        title="¿Quieres salir de Seerial?"
        primaryAction={{
          label: 'Salir',
          onPress: handleConfirmExit,
        }}
        secondaryAction={{
          label: 'Cancelar',
          onPress: handleCancelExit,
        }}
      />

      <GradientBackground imageSrc={imageSrc} index={0} />
      <HomeHeroImage imageSrc={imageSrc} />

      <DetailsInfo
        details={{
          title: selectedElement?.title ?? '',
          subtitle: selectedElement?.subtitle ?? '',
          genres: selectedElement?.genres.join(', ') ?? '',
          description: selectedElement?.overview ?? '',
        }}
        durationInfo={selectedElement?.duration}
        timeWatchedInfo={selectedElement?.timeWatched}
        infoItems={infoItems}
        enableKeyboardBack={false}
        hideButtons
      />

      <ListTitle className="z-10 mt-5">{t('continueWatching')}</ListTitle>

      {/* <LogoIntro /> */}

      <NavigationScrollView
        className="gap-5 pb-5 z-10 w-full"
        direction="horizontal"
        scrollMode="center"
        isRestoringFocus={false}
        focusedElementId={selectedElement?.id}
      >
        {continueWatchingContent}
      </NavigationScrollView>
    </Page>
  );
}

export default Home;
