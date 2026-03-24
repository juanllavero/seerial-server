import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { type LibraryItem, LibraryTypes } from '@seerial/domain';
import { useDataStore } from '@seerial/stores';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import NavigationGridView from '@/components/navigation/NavigationGridView';
import { LibraryContentItemType } from '@/data/enums/enums';
import Page from '@/shared/components/page';
import ContentCard from '@/shared/ui/card';
import ItemsPerRowSlider from './items-per-row-slider';

const MIN_ITEMS_PER_ROW = 4;
const MAX_ITEMS_PER_ROW = 10;
const DEFAULT_ITEMS_PER_ROW = 8;
const GRID_GAP_REM = 1.25;

interface LibraryContentProps {
  content: LibraryItem[] | undefined;
  libraryType?: string;
  selectedElement: LibraryItem | null;
  setSelectedElement: (item: LibraryItem) => void;
  scrollMode?: 'top' | 'center';
}

function LibraryContent({
  content,
  libraryType,
  selectedElement,
  setSelectedElement,
  scrollMode = 'top',
}: LibraryContentProps) {
  const navigate = useNavigate();
  const [itemsPerRow, setItemsPerRow] = useState(DEFAULT_ITEMS_PER_ROW);
  const isMusicLibrary = libraryType === LibraryTypes.MUSIC;
  const cardWidth = `calc((100% - ${(itemsPerRow - 1) * GRID_GAP_REM}rem) / ${itemsPerRow})`;

  const { lastFocusedElementId, setLastFocusedElementId } = useDataStore(
    (state) => ({
      lastFocusedElementId: state.lastFocusedElementId,
      setLastFocusedElementId: state.setLastFocusedElementId,
    }),
    shallow,
  );

  useEffect(() => {
    if (lastFocusedElementId && content?.find((item) => item.id === lastFocusedElementId)) {
      setFocus(lastFocusedElementId);
    } else if (content && content.length > 0) {
      setFocus(content[0].id);
    }
  }, [lastFocusedElementId, content]);

  return (
    <Page padding="0 2rem">
      <GradientBackground imageSrc={selectedElement?.coverSrc} index={0} />
      <div className="z-10 flex h-full w-full flex-col gap-4 overflow-hidden pt-6">
        <ItemsPerRowSlider
          value={itemsPerRow}
          min={MIN_ITEMS_PER_ROW}
          max={MAX_ITEMS_PER_ROW}
          onChange={setItemsPerRow}
        />
        <NavigationGridView
          className="z-10 flex-1 gap-5 content-start"
          style={{ gap: `${GRID_GAP_REM}rem` }}
          scrollMode={scrollMode}
          focusedElementId={lastFocusedElementId}
        >
          {content?.map((item) => (
            // Music libraries should always render square covers.
            // Fallback to album type check for mixed/legacy payloads.
            <ContentCard
              key={item.id}
              customKey={item.id}
              title={item.title}
              subtitle={item.years}
              width={cardWidth}
              onFocus={() => {
                setSelectedElement(item);
                setLastFocusedElementId(item.id);
              }}
              aspectRatio={
                isMusicLibrary || item.type === LibraryContentItemType.ALBUM ? '1' : '2/3'
              }
              imgSrc={item.coverSrc ?? ''}
              action={() => {
                navigate(
                  `/details/${item.type}/${item.id}${item.type === 'collection' ? `/${item.type}` : ''}`,
                  {
                    state: { cachedDetails: item.details },
                  },
                );
              }}
            />
          ))}
        </NavigationGridView>
      </div>
    </Page>
  );
}

export default memo(LibraryContent);
