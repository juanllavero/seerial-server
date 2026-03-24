import { useGetLibraryContent } from '@seerial/api';
import type { LibraryItem } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useState } from 'react';
import { useParams } from 'react-router';
import LibraryContent from '@/features/library-content/library-content';
import Loading from '@/shared/components/loading';

function LibraryPage() {
  const { libraryId, type } = useParams();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [selectedElement, setSelectedElement] = useState<LibraryItem | null>(null);

  const { data: libraryContent, isLoading } = useGetLibraryContent<LibraryItem[]>(libraryId ?? '', {
    enabled: !!libraryId && !!type && serverUrl !== '',
    params: type ? { type } : undefined,
  });

  if (isLoading && libraryContent && libraryContent.length === 0) {
    return <Loading />;
  }

  if (!isLoading && !libraryContent) return <span>Library not found</span>;

  return (
    <LibraryContent
      content={libraryContent}
      libraryType={type}
      selectedElement={selectedElement}
      setSelectedElement={setSelectedElement}
    />
  );
}

export default LibraryPage;
