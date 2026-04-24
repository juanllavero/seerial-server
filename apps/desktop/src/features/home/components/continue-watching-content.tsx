import type { ContinueWatchingVideoDTO } from '@seerial/domain';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { NavigationScrollView } from '@/shared/components/navigation';
import { ListTitle } from '@/shared/components/text';
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
            action={() => {
              if (element.id === selectedElement?.id) {
                navigate(
                  `/details/${element.seriesId ? 'series' : 'movie'}/${element.seriesId ? element.seriesId : element.movieId}`,
                  {
                    state: { cachedDetails: element.details },
                  },
                );
              } else {
                setSelectedElement(element);
              }
            }}
            duration={element.duration}
            timeWatched={element.timeWatched}
          />
        ))}
      </NavigationScrollView>
    </>
  );
}

export default memo(ContinueWatchingContent);
