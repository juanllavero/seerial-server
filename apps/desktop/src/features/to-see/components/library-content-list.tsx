import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetLibraryContent } from '@seerial/api';
import { type LibraryItem } from '@seerial/domain';
import { useDataStore, useServerStore } from '@seerial/stores';
import { t } from 'i18next';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { shallow } from 'zustand/shallow';
import NavigationScrollView from '@/components/navigation/NavigationScrollView';
import ListTitle from '@/components/text/ListTitle';
import FlexBox from '@/components/ui/FlexBox';
import Loading from '@/shared/components/loading';
import ContentCard from '@/shared/ui/card';

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
  const navigate = useNavigate();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

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

  const content = libraryContent ?? [];

  useEffect(() => {
    const matchingItem = content.find((item) => `${libraryId}-${item.id}` === lastFocusedElementId);

    if (matchingItem) {
      setFocus(`${libraryId}-${matchingItem.id}`);
    }
  }, [content, libraryId, lastFocusedElementId]);

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
            />
          ))
        ) : isLoading ? (
          <Loading />
        ) : (
          t('noContent')
        )}
      </NavigationScrollView>
    </FlexBox>
  );
}

export default LibraryContentList;
