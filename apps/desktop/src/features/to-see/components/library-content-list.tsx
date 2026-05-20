import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { API, apiClient, useGetLibraryContent } from '@seerial/api';
import type { LibraryItem } from '@seerial/domain';
import { useDataStore, useServerStore } from '@seerial/stores';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import Loading from '@/shared/components/loading';
import { NavigationScrollView } from '@/shared/components/navigation';
import { ListTitle } from '@/shared/components/text';
import CardContextMenu from '@/shared/components/ui/card-context-menu';
import ContentCard from '@/shared/components/ui/content-card';
import FlexBox from '@/shared/components/ui/flex-box';

interface LibraryContentListProps {
  libraryName: string;
  libraryId: string;
  watched?: boolean;
  focusedElementId?: string;
  isRestoringFocus?: boolean;
  selectBackground: (imageSrc: string | undefined) => void;
}

function LibraryContentList({
  libraryName,
  libraryId,
  watched,
  focusedElementId,
  isRestoringFocus = true,
  selectBackground,
}: LibraryContentListProps) {
  const { t: tLocal } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const currentUser = useServerStore((state) => state.currentUser);

  const { data: libraryContent, isLoading } = useGetLibraryContent<LibraryItem[]>(libraryId, {
    enabled: !!libraryId && serverUrl !== '',
    params: watched === undefined ? undefined : { watched },
  });

  const { lastFocusedElementId, setLastFocusedElementId } = useDataStore(
    (state) => ({
      lastFocusedElementId: state.lastFocusedElementId,
      setLastFocusedElementId: state.setLastFocusedElementId,
    }),
    shallow,
  );

  const [contextMenuItem, setContextMenuItem] = useState<LibraryItem | null>(null);
  const [previousFocusKey, setPreviousFocusKey] = useState<string | undefined>(undefined);

  const content = libraryContent ?? [];

  useEffect(() => {
    const matchingItem = content.find((item) => `${libraryId}-${item.id}` === lastFocusedElementId);

    if (matchingItem) {
      setFocus(`${libraryId}-${matchingItem.id}`);
    }
  }, [content, libraryId, lastFocusedElementId]);

  const handleMarkWatched = useCallback(
    async (item: LibraryItem, isWatched: boolean) => {
      try {
        if (item.type === 'movie') {
          await apiClient.post(API.movies.setWatchState(item.id), { watched: isWatched });
        } else if (item.type === 'series') {
          await apiClient.post(API.series.setWatchState(item.id), {
            watched: isWatched,
            userId: currentUser?.id,
          });
        } else if (item.type === 'collection') {
          const res = await apiClient.get<{
            movies: LibraryItem[];
            series: LibraryItem[];
          }>(API.collections.content(item.id));
          await Promise.all([
            ...res.data.movies.map((m) =>
              apiClient.post(API.movies.setWatchState(m.id), { watched: isWatched }),
            ),
            ...res.data.series.map((s) =>
              apiClient.post(API.series.setWatchState(s.id), {
                watched: isWatched,
                userId: currentUser?.id,
              }),
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

  const handleLongPress = useCallback(
    (item: LibraryItem) => {
      setPreviousFocusKey(getCurrentFocusKey() ?? `${libraryId}-${item.id}`);
      setContextMenuItem(item);
    },
    [libraryId],
  );

  return (
    <FlexBox direction="column" gap={1} width="100%" css={{ minWidth: 0 }}>
      <ListTitle>{libraryName}</ListTitle>
      <NavigationScrollView
        className="z-10 w-full min-w-0 gap-5 pb-2"
        direction="horizontal"
        scrollMode="center"
        isRestoringFocus={isRestoringFocus}
        focusedElementId={focusedElementId}
      >
        {content.length > 0 ? (
          content.map((item) => (
            <ContentCard
              key={item.id}
              imgSrc={item.coverSrc ?? ''}
              customKey={`${libraryId}-${item.id}`}
              width={'26dvh'}
              title={item.title}
              subtitle={item.years}
              onFocus={() => {
                setLastFocusedElementId(`${libraryId}-${item.id}`);
                selectBackground(item.coverSrc);
              }}
              aspectRatio="2/3"
              action={() => {
                navigate(`/details/${item.type}/${item.id}`, {
                  state: { cachedDetails: item.details },
                });
              }}
              onLongPress={() => handleLongPress(item)}
            />
          ))
        ) : isLoading ? (
          <Loading />
        ) : (
          t('noContent')
        )}
      </NavigationScrollView>

      {contextMenuItem && (
        <CardContextMenu
          title={contextMenuItem.title}
          previousFocusKey={previousFocusKey}
          onClose={() => setContextMenuItem(null)}
          items={[
            {
              label: tLocal('markAsWatched'),
              action: () => handleMarkWatched(contextMenuItem, true),
            },
          ]}
        />
      )}
    </FlexBox>
  );
}

export default LibraryContentList;
