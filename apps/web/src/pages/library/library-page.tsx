import { API, useGet } from '@seerial/api';
import type { Library } from '@seerial/domain';
import { useDataStore } from '@seerial/stores';
import { memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { NoContent } from '@/features/home';
import { LibraryContent } from '@/features/library';
import LoadingInsideSidebar from '@/shared/ui/loading-inside-sidebar';

function LibraryPage() {
  const { libraryId } = useParams();
  const { selectedLibraryId, selectLibrary } = useDataStore(
    (state) => ({
      selectedLibraryId: state.selectedLibraryId,
      selectLibrary: state.selectLibrary,
    }),
    shallow,
  );

  const {
    data: library,
    isLoading,
    mutate,
  } = useGet<Library>(libraryId ? API.libraries.getById(libraryId) : '');

  useEffect(() => {
    if (library && library.id !== selectedLibraryId) {
      selectLibrary(library.id);
    }
  }, [library, selectedLibraryId, selectLibrary]);

  if (isLoading) {
    return <LoadingInsideSidebar />;
  }

  if (!library) {
    return <NoContent />;
  }

  return <LibraryContent library={library} mutateLibrary={mutate} />;
}

export default memo(LibraryPage);
