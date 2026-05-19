import type { LibraryItem, LibraryType } from '@seerial/domain';
import { useReorderableList } from '@seerial/hooks';
import { memo } from 'react';
import { useCardWidth } from '@/shared/hooks/use-card-width';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { SortableGrid } from '@/shared/lists/sortable-grid';
import Grid from '@/shared/ui/grid';
import MediaCard from './cards/media-card';
import type { QueryObserverResult } from '@tanstack/react-query';

interface LibraryContentProps {
  libraryContent: LibraryItem[];
  libraryType: LibraryType;
  libraryId: string;
  mutate: () => Promise<QueryObserverResult<LibraryItem[], Error>>;
}

function LibraryContent({ libraryContent, libraryType, libraryId, mutate }: LibraryContentProps) {
  const isMobile = useIsMobile();
  const { cardWidth } = useCardWidth();

  const { items, handleDragEnd } = useReorderableList(libraryContent, libraryId, mutate);

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
          <MediaCard key={item.id} item={item} libraryType={libraryType} libraryId={libraryId} />
        )}
      />
    </Grid>
  );
}

export default memo(LibraryContent);
