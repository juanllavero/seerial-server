import { useGetLibraryContent } from '@seerial/api';
import type { LibraryItem } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import GradientBackground from '@/components/backgrounds/GradientBackground';
import ContentCard from '@/components/Card';
import Loading from '@/components/Loading';
import NavigationGridView from '@/components/navigation/NavigationGridView';
import Page from '@/components/Page';
import { LibraryTypes } from '@/data/enums/enums';

const ITEMS_PER_ROW = 5;
const ITEMS_PER_ROW_ULTRAWIDE = 8;
const GAP_REM = 1.25;
const PADDING_REM = 7;
const REM_TO_PX = 16;

function LibraryPage() {
  const { libraryId, type } = useParams();
  const navigate = useNavigate();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [selectedElement, setSelectedElement] = useState<LibraryItem | null>(null);

  const screenWidth = screen.width;

  const isUltrawide = screenWidth / screen.height >= 1.8;
  const itemsPerRow = isUltrawide ? ITEMS_PER_ROW_ULTRAWIDE : ITEMS_PER_ROW;
  const numGaps = itemsPerRow - 1;
  const gapPx = GAP_REM * REM_TO_PX; // 1.25rem = 20px
  const paddingPx = PADDING_REM * REM_TO_PX; // 6rem = 96px
  const totalGapWidthDvw = ((numGaps * gapPx) / screenWidth) * 100; // Convert gaps to dvw
  const paddingDvw = (paddingPx / screenWidth) * 100; // Convert padding to dvw
  const availableWidth = 100 - totalGapWidthDvw - paddingDvw; // Subtract gaps and padding
  const itemWidth = `${availableWidth / itemsPerRow}dvw`; // Width per item

  const { data: libraryContent, isLoading } = useGetLibraryContent<LibraryItem[]>(libraryId ?? '', {
    enabled: !!libraryId && !!type && serverUrl !== '',
    params: type ? { type } : undefined,
  });

  if (isLoading && libraryContent && libraryContent.length === 0) {
    return <Loading />;
  }

  if (!isLoading && !libraryContent) return <span>Library not found</span>;

  return (
    <Page padding="0 2rem">
      <GradientBackground imageSrc={selectedElement?.data.posterSrc} index={0} />
      <NavigationGridView className="gap-5 z-10">
        {libraryContent?.map((item) => (
          <ContentCard
            key={item.data.id}
            customKey={item.data.id}
            title={item.data.title}
            width={itemWidth}
            onFocus={() => setSelectedElement(item)}
            aspectRatio={type === LibraryTypes.MUSIC ? '1' : '2/3'}
            imgSrc={item.data.posterSrc}
            action={() => {
              navigate(
                `/details/${item.type === 'movies' ? 'movie' : item.type === 'shows' ? 'series' : item.type === 'albums' ? 'album' : 'collection'}/${item.data.id}${item.type === 'collection' ? `/${type}` : ''}`,
              );
            }}
          />
        ))}
      </NavigationGridView>
    </Page>
  );
}

export default LibraryPage;
