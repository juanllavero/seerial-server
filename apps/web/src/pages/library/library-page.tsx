import { useDataStore, useServerStore } from '@seerial/stores';
import { memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { NoContent } from '@/features/home';
import { LibraryContent } from '@/features/library';
import LoadingInsideSidebar from '@/shared/ui/loading-inside-sidebar';
import { useGetLibraryContent } from '@seerial/api';
import { type LibraryItem, type LibraryType, LibraryTypes } from '@seerial/domain';

function LibraryPage() {
  const { libraryId, type } = useParams();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const { selectedLibraryId, selectLibrary } = useDataStore(
    (state) => ({
      selectedLibraryId: state.selectedLibraryId,
      selectLibrary: state.selectLibrary,
    }),
    shallow,
  );

  const {
    data: libraryContent,
    isLoading,
    mutate,
  } = useGetLibraryContent<LibraryItem[]>(libraryId ?? '', {
    enabled: !!libraryId && !!type && serverUrl !== '',
    params: type ? { type } : undefined,
  });

  useEffect(() => {
    if (libraryId && libraryId !== selectedLibraryId) {
      selectLibrary(libraryId);
    }
  }, [libraryId, selectedLibraryId, selectLibrary]);

  if (!libraryId) {
    return <h2>No Library ID</h2>;
  }

  if (isLoading) {
    return <LoadingInsideSidebar />;
  }

  if (!libraryContent || libraryContent.length === 0) {
    return <NoContent />;
  }

  return (
    <LibraryContent
      libraryContent={libraryContent}
      libraryType={type ? (type as LibraryType) : LibraryTypes.MOVIES}
      libraryId={libraryId}
      mutate={mutate}
    />
  );
}

export default memo(LibraryPage);
