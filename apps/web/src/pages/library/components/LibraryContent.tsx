import { API, useGet } from '@seerial/api';
import type { Library, LibraryItem } from '@seerial/domain';
import { useReorderableList } from '@seerial/hooks';
import { memo } from 'react';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { SortableGrid } from '@/components/lists/SortableGrid';
import Grid from '@/components/ui/Grid';
import { LibraryTypes } from '@/data/enums/LibraryTypes';
import { useCardWidth } from '@/hooks/useCardWidth';
import MediaCard from './cards/MediaCard';

interface LibraryContentProps {
  library: Library;
  mutateLibrary: () => void;
}

function LibraryContent({ library, mutateLibrary }: LibraryContentProps) {
  const isMobile = useIsMobile();
  const { cardWidth } = useCardWidth();

  const queryType =
    library.type === LibraryTypes.MUSIC
      ? 'Music'
      : library.type === LibraryTypes.SHOWS
        ? 'Shows'
        : 'Movies';

  const { data: libraryItems, isLoading } = useGet<LibraryItem[]>(
    `${API.libraries.content(library.id)}?type=${queryType}`,
  );

  const { items, handleDragEnd } = useReorderableList(
    libraryItems || [],
    library.id,
    mutateLibrary,
  );

  if (isLoading) return null;

  return (
    <Grid
      columns={
        isMobile
          ? `repeat(auto-fit, minmax(${cardWidth * 0.8}px, 1fr))`
          : `repeat(auto-fit, minmax(${cardWidth * 0.8}px, ${cardWidth * 1.2}px))`
      }
      rows="0fr"
      gap="1rem"
      height="100%"
      padding={isMobile ? '1rem 1rem 5rem 1rem' : '2rem 2rem 5rem 2rem'}
      scroll="vertical"
      justifyContent="start"
      alignItems="start"
      hideScrollbar
    >
      <SortableGrid
        items={items}
        onDragEnd={handleDragEnd}
        renderItem={(item: LibraryItem) => (
          <MediaCard key={item.id} item={item} libraryType={library.type} />
        )}
      />
    </Grid>
  );
}

export default memo(LibraryContent);
