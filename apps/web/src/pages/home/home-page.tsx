import { API, useGet } from '@seerial/api';
import type { Library } from '@seerial/domain';
import { useDataStore, useServerStore } from '@seerial/stores';
import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { HomePageContent, NoApiKey, NoContent, NotAvailableServer } from '@/features/home';
import LoadingInsideSidebar from '@/shared/ui/loading-inside-sidebar';

export default function HomePage() {
  const { serverOnline, apiKeyStatus, gettingServerStatus, gettingApiKeyStatus } = useServerStore(
    (state) => ({
      serverOnline: state.serverOnline,
      apiKeyStatus: state.apiKeyStatus,
      gettingServerStatus: state.gettingServerStatus,
      gettingApiKeyStatus: state.gettingApiKeyStatus,
    }),
    shallow,
  );
  const selectLibrary = useDataStore((state) => state.selectLibrary);

  // Get Libraries
  const { data: libraries, isLoading: loadingLibraries } = useGet<Library[]>(API.libraries.getAll, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  useEffect(() => {
    selectLibrary(null);
  }, [selectLibrary]);

  if (loadingLibraries || gettingServerStatus || gettingApiKeyStatus) {
    return <LoadingInsideSidebar />;
  }

  if (!serverOnline) {
    return <NotAvailableServer />;
  }

  if (!apiKeyStatus) {
    return <NoApiKey />;
  }

  if (!libraries || libraries.length === 0) {
    return <NoContent />;
  }

  return <HomePageContent />;
}
