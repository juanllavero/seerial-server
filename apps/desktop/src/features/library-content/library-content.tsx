import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { API, apiClient, useReorderLibraryItems } from '@seerial/api';
import { LibraryContentItemType, type LibraryItem, LibraryTypes } from '@seerial/domain';
import { useDataStore, useGradientStore, useServerStore } from '@seerial/stores';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import { NavigationGridView } from '@/shared/components/navigation';
import Page from '@/shared/components/page';
import CardContextMenu from '@/shared/components/ui/card-context-menu';
import ContentCard, { type ReorderingArrows } from '@/shared/components/ui/content-card';
import type { ScrollMode } from '@/shared/hooks/use-auto-scroll';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { useSettingsStore } from '@/shared/stores';

const GRID_GAP_REM = 1.25;

interface LibraryContentProps {
  content: LibraryItem[] | undefined;
  libraryId?: string;
  libraryType?: string;
  selectedElement: LibraryItem | null;
  setSelectedElement: (item: LibraryItem) => void;
  scrollMode?: ScrollMode;
  isRestoringFocus?: boolean;
}

function LibraryContent({
  content,
  libraryId,
  libraryType,
  selectedElement,
  setSelectedElement,
  scrollMode = 'start',
  isRestoringFocus = true,
}: LibraryContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setGradientImageSrc = useGradientStore((state) => state.setGradientImageSrc);
  const currentUser = useServerStore((state) => state.currentUser);

  useEffect(() => {
    const src = selectedElement?.coverSrc || selectedElement?.images?.[0] || '';
    setGradientImageSrc(src);
  }, [selectedElement, setGradientImageSrc]);
  const itemsPerRow = useSettingsStore((s) => s.settings.cardsPerRow);
  const isMusicLibrary = libraryType === LibraryTypes.MUSIC;
  const finalItemsPerRow = isMusicLibrary ? itemsPerRow - 1 : itemsPerRow; // Music libraries have smaller cards, so we can fit more in the same space.
  const cardWidth = `calc((100% - ${(finalItemsPerRow - 1) * GRID_GAP_REM}rem) / ${finalItemsPerRow})`;
  const defaultImageSrc = isMusicLibrary ? '/img/songDefault.png' : '/img/fileNotFound.jpg';

  const { lastFocusedElementId, setLastFocusedElementId } = useDataStore(
    (state) => ({
      lastFocusedElementId: state.lastFocusedElementId,
      setLastFocusedElementId: state.setLastFocusedElementId,
    }),
    shallow,
  );

  // Context menu state
  const [contextMenuItem, setContextMenuItem] = useState<LibraryItem | null>(null);
  const [previousFocusKey, setPreviousFocusKey] = useState<string | undefined>(undefined);

  // Reorder state
  const [isReorderingMode, setIsReorderingMode] = useState(false);
  const [reorderingItemId, setReorderingItemId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<LibraryItem[]>([]);
  // Keep a ref to localItems so event handlers in reorder always have the latest value.
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;

  const { mutateAsync: reorderItems } = useReorderLibraryItems(libraryId ?? '');

  useEffect(() => {
    if (lastFocusedElementId && content?.find((item) => item.id === lastFocusedElementId)) {
      setFocus(lastFocusedElementId);
    } else if (content && content.length > 0) {
      setFocus(content[0].id);
    }
  }, [lastFocusedElementId, content]);

  // Sync localItems when content changes and we're not in reorder mode
  useEffect(() => {
    if (!isReorderingMode && content) {
      setLocalItems(content);
    }
  }, [content, isReorderingMode]);

  const handleFocus = useCallback(
    (item: LibraryItem) => {
      setSelectedElement(item);
      setLastFocusedElementId(item.id);
    },
    [setSelectedElement, setLastFocusedElementId],
  );

  const handleAction = useCallback(
    (item: LibraryItem) => {
      navigate(
        `/details/${item.type}/${item.id}${item.type === 'collection' ? `/${libraryType}` : ''}`,
        {
          state: {
            cachedDetails: item.details,
            numberOfItems: item.numberOfItems,
            collectionId: item.collectionId,
            currentSeasonNumber: item.currentSeasonNumber,
            libraryType: libraryType,
            collageImages: item.images,
          },
        },
      );
    },
    [navigate, libraryType],
  );

  const handleMarkWatched = useCallback(
    async (item: LibraryItem, watched: boolean) => {
      try {
        if (item.type === 'movie') {
          await apiClient.post(API.movies.setWatchState(item.id), { watched });
        } else if (item.type === 'series') {
          await apiClient.post(API.series.setWatchState(item.id), {
            watched,
            userId: currentUser?.id,
          });
        } else if (item.type === 'collection') {
          const res = await apiClient.get<{
            movies: LibraryItem[];
            series: LibraryItem[];
          }>(API.collections.content(item.id));
          await Promise.all([
            ...res.data.movies.map((m) =>
              apiClient.post(API.movies.setWatchState(m.id), { watched }),
            ),
            ...res.data.series.map((s) =>
              apiClient.post(API.series.setWatchState(s.id), { watched, userId: currentUser?.id }),
            ),
          ]);
        }
        await queryClient.invalidateQueries({ queryKey: ['libraries', 'content', libraryId] });
      } catch {
        // Silently fail
      }
    },
    [currentUser, queryClient, libraryId],
  );

  const handleExitReorder = useCallback(async () => {
    setIsReorderingMode(false);
    setReorderingItemId(null);
    if (libraryId) {
      try {
        await reorderItems({
          libraryId,
          orderedItems: localItemsRef.current.map((item) => ({ id: item.id, type: item.type })),
        });
        await queryClient.invalidateQueries({ queryKey: ['libraries', 'content', libraryId] });
      } catch {
        // Silently fail
      }
    }
  }, [libraryId, reorderItems, queryClient]);

  useKeyboardBack({
    enabled: isReorderingMode,
    navigateOnBack: false,
    capture: true,
    preAction: handleExitReorder,
  });

  const handleReorderMove = useCallback(
    (itemId: string, direction: 'up' | 'down' | 'left' | 'right') => {
      setLocalItems((prev) => {
        const idx = prev.findIndex((i) => i.id === itemId);
        if (idx === -1) return prev;
        let newIdx = idx;
        if (direction === 'left') newIdx = idx - 1;
        else if (direction === 'right') newIdx = idx + 1;
        else if (direction === 'up') newIdx = idx - finalItemsPerRow;
        else if (direction === 'down') newIdx = idx + finalItemsPerRow;
        if (newIdx < 0 || newIdx >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
        return next;
      });
    },
    [finalItemsPerRow],
  );

  const handleLongPress = useCallback((item: LibraryItem) => {
    setPreviousFocusKey(getCurrentFocusKey() ?? item.id);
    setContextMenuItem(item);
  }, []);

  const cards = useMemo(
    () =>
      localItems.map((item, idx) => {
        const isItemReordering = isReorderingMode && reorderingItemId === item.id;
        const reorderingArrows: ReorderingArrows | undefined = isItemReordering
          ? {
              up: idx - finalItemsPerRow >= 0,
              down: idx + finalItemsPerRow < localItems.length,
              left: idx > 0,
              right: idx < localItems.length - 1,
            }
          : undefined;

        return (
          <ContentCard
            key={item.id}
            customKey={item.id}
            title={item.title}
            subtitle={item.years}
            width={cardWidth}
            onFocus={() => handleFocus(item)}
            aspectRatio={isMusicLibrary || item.type === LibraryContentItemType.ALBUM ? '1' : '2/3'}
            imgSrc={
              item.images && item.images.length === 1 ? item.images[0] : (item.coverSrc ?? '')
            }
            collageImages={item.images && item.images.length > 1 ? item.images : undefined}
            defaultImageSrc={defaultImageSrc}
            action={() => {
              if (isReorderingMode && reorderingItemId === item.id) {
                handleExitReorder();
              } else {
                handleAction(item);
              }
            }}
            onLongPress={isReorderingMode ? undefined : () => handleLongPress(item)}
            isReordering={isItemReordering}
            reorderingArrows={reorderingArrows}
            onReorderMove={isItemReordering ? (dir) => handleReorderMove(item.id, dir) : undefined}
          />
        );
      }),
    [
      localItems,
      cardWidth,
      isMusicLibrary,
      defaultImageSrc,
      handleFocus,
      handleAction,
      handleLongPress,
      handleExitReorder,
      handleReorderMove,
      isReorderingMode,
      reorderingItemId,
      finalItemsPerRow,
    ],
  );

  return (
    <Page padding="0 4dvh">
      <NavigationGridView
        className="z-10 flex-1 gap-5 content-start pt-[2dvh] pb-[4dvh]"
        style={{ gap: `${GRID_GAP_REM}rem` }}
        scrollMode={scrollMode}
        focusedElementId={lastFocusedElementId}
        isRestoringFocus={isRestoringFocus}
      >
        {cards}
      </NavigationGridView>

      {contextMenuItem && (
        <CardContextMenu
          title={contextMenuItem.title}
          previousFocusKey={previousFocusKey}
          onClose={() => setContextMenuItem(null)}
          items={
            isMusicLibrary
              ? []
              : [
                  {
                    label: t('reorderMode'),
                    action: () => {
                      setIsReorderingMode(true);
                      setReorderingItemId(contextMenuItem.id);
                    },
                  },
                  {
                    label: t('markAsWatched'),
                    action: () => handleMarkWatched(contextMenuItem, true),
                  },
                ]
          }
        />
      )}
    </Page>
  );
}

export default memo(LibraryContent);
