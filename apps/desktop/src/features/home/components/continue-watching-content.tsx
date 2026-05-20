import { getCurrentFocusKey } from '@noriginmedia/norigin-spatial-navigation';
import { API, apiClient } from '@seerial/api';
import type { ContinueWatchingVideoDTO } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { NavigationScrollView } from '@/shared/components/navigation';
import { ListTitle } from '@/shared/components/text';
import CardContextMenu from '@/shared/components/ui/card-context-menu';
import ContentCard from '@/shared/components/ui/content-card';

interface ContinueWatchingContentProps {
  continueWatching: ContinueWatchingVideoDTO[];
  selectedElement: ContinueWatchingVideoDTO | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<ContinueWatchingVideoDTO | null>>;
}

function ContinueWatchingContent({
  continueWatching,
  selectedElement,
  setSelectedElement,
}: ContinueWatchingContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useServerStore((state) => state.currentUser);

  const [contextMenuElement, setContextMenuElement] = useState<ContinueWatchingVideoDTO | null>(
    null,
  );
  const [previousFocusKey, setPreviousFocusKey] = useState<string | undefined>(undefined);

  const handleLongPress = useCallback((element: ContinueWatchingVideoDTO) => {
    setPreviousFocusKey(getCurrentFocusKey() ?? element.id);
    setContextMenuElement(element);
  }, []);

  const handleMarkWatched = useCallback(
    async (element: ContinueWatchingVideoDTO) => {
      if (!currentUser?.id) return;
      try {
        await apiClient.patch(API.watchLists.updateWatchState, {
          videoId: element.videoId,
          timeWatched: element.duration * 60,
          watched: true,
          userId: currentUser.id,
        });
        await queryClient.invalidateQueries({ queryKey: ['continueWatching', 'getVideos'] });
      } catch {
        // Silently fail — user will see no visual change
      }
    },
    [currentUser, queryClient],
  );

  return (
    <>
      <ListTitle className="z-10 mt-5">{t('continueWatching')}</ListTitle>

      <NavigationScrollView
        className="gap-5 pb-10 z-10 w-full"
        direction="horizontal"
        scrollMode="center"
        isRestoringFocus={false}
        focusedElementId={selectedElement?.id}
      >
        {continueWatching.map((element: ContinueWatchingVideoDTO) => (
          <ContentCard
            key={element.id}
            imgSrc={element.posterImage ?? ''}
            customKey={element.id}
            width={'28dvh'}
            noInfo
            onFocus={() => setSelectedElement(element)}
            aspectRatio="2/3"
            action={() =>
              navigate(
                `/details/${element.seriesId ? 'series' : 'movie'}/${element.seriesId ? element.seriesId : element.movieId}`,
                { state: { cachedDetails: element.details } },
              )
            }
            duration={element.duration}
            timeWatched={element.timeWatched}
            onLongPress={() => handleLongPress(element)}
          />
        ))}
      </NavigationScrollView>

      {contextMenuElement && (
        <CardContextMenu
          title={contextMenuElement.title}
          previousFocusKey={previousFocusKey}
          onClose={() => setContextMenuElement(null)}
          items={[
            {
              label: t('playButton'),
              action: () => navigate(`/video-player/${contextMenuElement.videoId}`),
            },
            {
              label: t('goToContent'),
              action: () =>
                navigate(
                  `/details/${contextMenuElement.seriesId ? 'series' : 'movie'}/${contextMenuElement.seriesId ? contextMenuElement.seriesId : contextMenuElement.movieId}`,
                  { state: { cachedDetails: contextMenuElement.details } },
                ),
            },
            {
              label: t('markAsWatched'),
              action: () => handleMarkWatched(contextMenuElement),
            },
          ]}
        />
      )}
    </>
  );
}

export default memo(ContinueWatchingContent);
