import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetContinueWatching } from '@seerial/api';
import type { ContinueWatchingVideoDTO } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { HomePageContent } from '@/features/home';
import AppAlertDialog from '@/shared/components/app-alert-dialog';
import Loading from '@/shared/components/loading';
import Page from '@/shared/components/page';
import { Subtitle, Title } from '@/shared/components/text';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';

function Home() {
  const { currentUser } = useServerStore();
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

  if (isLoading) {
    return <Loading />;
  }

  if (!continueWatching || continueWatching.length === 0) {
    return (
      <Page justify="center" align="center">
        <Title>No tienes contenido en progreso</Title>
        <Subtitle>Empieza a ver algo para que aparezca aquí</Subtitle>
      </Page>
    );
  }

  return (
    <Page justify="end" padding="0">
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

      <HomePageContent
        continueWatching={continueWatching}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
      />
    </Page>
  );
}

export default Home;
