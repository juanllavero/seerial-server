import { useGetLibraryContent } from '@seerial/api';
import type { LibraryItem } from '@seerial/domain';
import { useDataStore, useServerStore } from '@seerial/stores';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import LibraryContent from '@/features/library-content/library-content';
import Loading from '@/shared/components/loading';

function LibraryPage() {
  const { libraryId, type } = useParams();
  const location = useLocation();

  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const lastFocusedElementId = useDataStore((state) => state.lastFocusedElementId);
  const [selectedElement, setSelectedElement] = useState<LibraryItem | null>(null);
  const prevLocationRef = useRef<string>('');
  const lastFocusIdRef = useRef<string | undefined>(undefined);
  const isFirstLoadRef = useRef(true);

  // Monitor user navigation: when lastFocusedElementId changes, it's user navigation
  useEffect(() => {
    if (
      lastFocusedElementId &&
      lastFocusIdRef.current !== undefined &&
      lastFocusIdRef.current !== lastFocusedElementId
    ) {
      // User navigated with arrow keys
      setIsRestoringFocus(false);
    }
    lastFocusIdRef.current = lastFocusedElementId;
  }, [lastFocusedElementId]);
  const [isRestoringFocus, setIsRestoringFocus] = useState(true);

  const { data: libraryContent, isLoading } = useGetLibraryContent<LibraryItem[]>(libraryId ?? '', {
    enabled: !!libraryId && !!type && serverUrl !== '',
    params: type ? { type } : undefined,
  });

  // Detect if we're coming back from another page (restore) vs navigating within library
  useEffect(() => {
    if (libraryContent && libraryContent.length > 0) {
      if (isFirstLoadRef.current) {
        // First load: always restore focus (coming from store)
        setIsRestoringFocus(true);
        isFirstLoadRef.current = false;
      } else {
        // Subsequent loads: check if we came from details page
        const isComingFromDetails = prevLocationRef.current.includes('/details');
        setIsRestoringFocus(isComingFromDetails);
      }
    }
    prevLocationRef.current = location.pathname;
  }, [libraryContent, location.pathname]);

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
      scrollMode="start"
      isRestoringFocus={isRestoringFocus}
    />
  );
}

export default LibraryPage;
