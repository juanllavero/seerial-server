import { API, useCreate, useGetMyListSeries } from '@seerial/api';
import type { Series } from '@seerial/domain';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import Card from '@/components/cards/Card';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useServerStore } from '@seerial/stores';
import { useDialogStore } from '@/context/dialog.store';
import { refreshMetadata, toggleSeriesWatched } from '@/utils/ReactUtils';
import HorizontalList from '../../../../components/lists/HorizontalList';
import HorizontalListSkeleton from './HorizontalListSkeleton';

type SeriesListItem = Series & { watchStatus?: boolean };

interface MyListShowsProps {
  goToContent: (url: string) => void;
}

function MyListShows({ goToContent }: MyListShowsProps) {
  const { t } = useTranslation();
  const { openDialog } = useDialogStore(
    (state) => ({
      openDialog: state.openDialog,
    }),
    shallow,
  );
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  );
  const isMobile = useIsMobile();

  // Get Shows in My List
  const { data: showsInMyList, isLoading, refetch } = useGetMyListSeries<SeriesListItem[]>();
  const { create } = useCreate<unknown>();

  return (
    <HorizontalList title={t('watchListShows')}>
      {isLoading ? (
        <HorizontalListSkeleton listType="MyListShows" />
      ) : showsInMyList && showsInMyList.length > 0 ? (
        showsInMyList.map((series: SeriesListItem) => (
          <Card
            key={`Home Card ${series.id}`}
            itemKey={`Home Card ${series.id}`}
            imgSrc={series.coverSrc}
            width={isMobile ? 130 : 180}
            aspectRatio={2 / 3}
            title={series.name}
            hidePlayButton
            watched={series.watchStatus !== undefined}
            menu={{
              items: [
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeFromMyList'),
                      action: async () => {
                        await create(API.myList.series, {
                          seriesId: series.id,
                          userId: user?.id,
                        });
                        void refetch();
                      },
                    },
                    {
                      title: t('updateMetadata'),
                      action: () => {
                        refreshMetadata('show', series.id);
                      },
                    },
                    {
                      title: t('correctIdentification'),
                      action: () =>
                        openDialog('identification', {
                          seriesId: series.id,
                        }),
                    },
                    {
                      title: t('changeEpisodesGroup'),
                      action: () => openDialog('episodesGroup', { seriesId: series.id }),
                    },
                    {
                      title:
                        series.watchStatus !== undefined ? t('markUnwatched') : t('markWatched'),
                      action: () =>
                        user && toggleSeriesWatched(series.id, !series.watchStatus, user.id),
                    },
                  ],
                },
                { separator: true, items: [] },
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeButton'),
                      action: () => console.log('Log out clicked'),
                    },
                  ],
                },
              ],
            }}
            subtitle={series.year ? new Date(series.year).getFullYear().toString() : 'N/A'}
            editModal={
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={(e) => {
                  e.stopPropagation();
                  openDialog('series', { id: series.id });
                }}
              >
                <Pencil size={16} />
              </Button>
            }
            action={() => goToContent(`/series/${series.id}`)}
          />
        ))
      ) : (
        t('noContent')
      )}
    </HorizontalList>
  );
}

export default MyListShows;
