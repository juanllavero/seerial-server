import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { API, apiClient, useReorderLibraryItems } from '@seerial/api';
import { LibraryContentItemType, type LibraryItem, LibraryTypes } from '@seerial/domain';
import { useDataStore, useGradientStore, useServerStore } from '@seerial/stores';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
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

interface LibraryContentState {
  contextMenuItem: LibraryItem | null;
  previousFocusKey?: string;
  isReorderingMode: boolean;
  reorderingItemId: string | null;
  localItems: LibraryItem[];
}

type LibraryContentAction =
  | { type: 'set-local-items'; items: LibraryItem[] }
  | { type: 'open-context-menu'; item: LibraryItem; previousFocusKey?: string }
  | { type: 'close-context-menu' }
  | { type: 'enter-reorder-mode'; itemId: string }
  | { type: 'exit-reorder-mode' }
  | {
      type: 'move-reorder-item';
      itemId: string;
      direction: 'up' | 'down' | 'left' | 'right';
      itemsPerRow: number;
    };

function libraryContentReducer(
  state: LibraryContentState,
  action: LibraryContentAction,
): LibraryContentState {
  switch (action.type) {
    case 'set-local-items':
      return { ...state, localItems: action.items };
    case 'open-context-menu':
      return {
        ...state,
        contextMenuItem: action.item,
        previousFocusKey: action.previousFocusKey,
      };
    case 'close-context-menu':
      return { ...state, contextMenuItem: null };
    case 'enter-reorder-mode':
      return {
        ...state,
        isReorderingMode: true,
        reorderingItemId: action.itemId,
      };
    case 'exit-reorder-mode':
      return {
        ...state,
        isReorderingMode: false,
        reorderingItemId: null,
      };
    case 'move-reorder-item': {
      const idx = state.localItems.findIndex((item) => item.id === action.itemId);
      if (idx === -1) {
        return state;
      }

      let newIdx = idx;
      if (action.direction === 'left') {
        newIdx = idx - 1;
      } else if (action.direction === 'right') {
        newIdx = idx + 1;
      } else if (action.direction === 'up') {
        newIdx = idx - action.itemsPerRow;
      } else if (action.direction === 'down') {
        newIdx = idx + action.itemsPerRow;
      }

      if (newIdx < 0 || newIdx >= state.localItems.length) {
        return state;
      }

      const next = [...state.localItems];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...state, localItems: next };
    }
    default:
      return state;
  }
}

function getReorderingArrows(
  isItemReordering: boolean,
  idx: number,
  finalItemsPerRow: number,
  totalItems: number,
): ReorderingArrows | undefined {
  if (!isItemReordering) {
    return undefined;
  }

  return {
    up: idx - finalItemsPerRow >= 0,
    down: idx + finalItemsPerRow < totalItems,
    left: idx > 0,
    right: idx < totalItems - 1,
  };
}

function getItemImageSource(item: LibraryItem): string {
  return item.images && item.images.length === 1 ? item.images[0] : (item.coverSrc ?? '');
}

function getItemCollageImages(item: LibraryItem): string[] | undefined {
  return item.images && item.images.length > 1 ? item.images : undefined;
}

function getItemAspectRatio(isMusicLibrary: boolean, itemType: LibraryItem['type']): '1' | '2/3' {
  return isMusicLibrary || itemType === LibraryContentItemType.ALBUM ? '1' : '2/3';
}

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
  const [libraryState, dispatch] = useReducer(libraryContentReducer, {
    contextMenuItem: null,
    previousFocusKey: undefined,
    isReorderingMode: false,
    reorderingItemId: null,
    localItems: content ?? [],
  });
  const { contextMenuItem, previousFocusKey, isReorderingMode, reorderingItemId, localItems } =
    libraryState;
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;

  const isReorderingModeRef = useRef(isReorderingMode);
  isReorderingModeRef.current = isReorderingMode;

  useEffect(() => {
    if (!isReorderingModeRef.current && content) {
      dispatch({ type: 'set-local-items', items: content });
    }
  }, [content]);

  const { mutateAsync: reorderItems } = useReorderLibraryItems(libraryId ?? '');

  useEffect(() => {
    if (lastFocusedElementId && content?.find((item) => item.id === lastFocusedElementId)) {
      setFocus(lastFocusedElementId);
    } else if (content && content.length > 0) {
      setFocus(content[0].id);
    }
  }, [lastFocusedElementId, content]);

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

  const handleReorderMove = useCallback(
    async (itemId: string, direction: 'up' | 'down' | 'left' | 'right') => {
      const items = localItemsRef.current;
      const idx = items.findIndex((item) => item.id === itemId);
      if (idx === -1) return;

      let newIdx = idx;
      if (direction === 'left') newIdx = idx - 1;
      else if (direction === 'right') newIdx = idx + 1;
      else if (direction === 'up') newIdx = idx - finalItemsPerRow;
      else if (direction === 'down') newIdx = idx + finalItemsPerRow;

      if (newIdx < 0 || newIdx >= items.length) return;

      const next = [...items];

      const [movedItem] = next.splice(idx, 1);

      next.splice(newIdx, 0, movedItem);

      dispatch({ type: 'set-local-items', items: next });

      setTimeout(() => {
        const el = document.querySelector(`[data-focus-key="${itemId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);

      if (libraryId) {
        try {
          await reorderItems({
            orderedItems: next.map((item) => ({ id: item.id, type: item.type })),
          });
          queryClient.invalidateQueries({ queryKey: ['libraries', 'content', libraryId] });
        } catch (error) {
          console.error('Error reordering items:', error);
        }
      }
    },
    [finalItemsPerRow, libraryId, reorderItems, queryClient],
  );

  const handleExitReorder = useCallback(() => {
    dispatch({ type: 'exit-reorder-mode' });
  }, []);

  const handleLongPress = useCallback((item: LibraryItem) => {
    dispatch({
      type: 'open-context-menu',
      item,
      previousFocusKey: getCurrentFocusKey() ?? item.id,
    });
  }, []);

  useKeyboardBack({
    enabled: isReorderingMode,
    navigateOnBack: false,
    capture: true,
    preAction: handleExitReorder,
  });

  const cards = useMemo(
    () =>
      localItems.map((item, idx) => {
        const isItemReordering = isReorderingMode && reorderingItemId === item.id;
        const reorderingArrows = getReorderingArrows(
          isItemReordering,
          idx,
          finalItemsPerRow,
          localItems.length,
        );

        return (
          <ContentCard
            key={item.id}
            customKey={item.id}
            title={item.title}
            subtitle={item.years}
            width={cardWidth}
            onFocus={() => handleFocus(item)}
            aspectRatio={getItemAspectRatio(isMusicLibrary, item.type)}
            imgSrc={getItemImageSource(item)}
            collageImages={getItemCollageImages(item)}
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
          onClose={() => dispatch({ type: 'close-context-menu' })}
          items={
            isMusicLibrary
              ? []
              : [
                  {
                    label: t('reorderMode'),
                    action: () => {
                      dispatch({ type: 'enter-reorder-mode', itemId: contextMenuItem.id });
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
