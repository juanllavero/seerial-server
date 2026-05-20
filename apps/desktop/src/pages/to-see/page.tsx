import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetLibraries } from '@seerial/api';
import { type Library, LibraryTypes } from '@seerial/domain';
import { useDataStore, useServerStore } from '@seerial/stores';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ToSee } from '@/features/to-see';
import Loading from '@/shared/components/loading';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';

function ToSeePage() {
  const navigate = useNavigate();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const lastFocusedElementId = useDataStore((state) => state.lastFocusedElementId);

  const { data: libraries, isLoading } = useGetLibraries<Library[]>({
    enabled: serverUrl !== '',
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const moviesLibraries = libraries?.filter((library) => library.type === LibraryTypes.MOVIES);
  const seriesLibraries = libraries?.filter((library) => library.type === LibraryTypes.SHOWS);

  const handleBackFromToSee = useCallback(() => {
    const currentFocusKey = getCurrentFocusKey();
    const isToSeeContentFocused =
      !!currentFocusKey && !!lastFocusedElementId && currentFocusKey === lastFocusedElementId;

    if (isToSeeContentFocused) {
      setFocus(NavigationFocusKeys.topBar.container);
      return;
    }

    navigate('/home');
  }, [lastFocusedElementId, navigate]);

  useKeyboardBack({
    enabled: !isLoading,
    navigateOnBack: false,
    preAction: handleBackFromToSee,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!libraries) {
    return <div>{'Error fetching libraries.'}</div>;
  }

  return <ToSee moviesLibraries={moviesLibraries ?? []} seriesLibraries={seriesLibraries ?? []} />;
}

export default ToSeePage;
