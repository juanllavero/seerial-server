import { useGetSeries, useSetSeriesWatchState } from '@seerial/api';
import type { Series } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { t } from 'i18next';
import { Button } from '@/shared/ui/button';
import { AddToListIcon, RemoveFromListIcon } from '@/shared/ui/icon-library';

interface MyListButtonProps {
  seriesId: string;
}

function MyListButton({ seriesId }: MyListButtonProps) {
  const user = useServerStore((state) => state.currentUser);
  const { data: series, refetch } = useGetSeries<Series>(seriesId, {
    enabled: Boolean(seriesId),
  });
  const { mutateAsync: setSeriesWatchState } = useSetSeriesWatchState<
    unknown,
    { seriesId: string; watched: boolean; userId?: string }
  >(seriesId);

  const inMyList =
    series?.watchLists?.some((list) => list.userId === user?.id && list.watched) ?? false;

  const toggleMyList = async () => {
    await setSeriesWatchState({
      seriesId,
      watched: !inMyList,
      userId: user?.id,
    });
    void refetch();
  };
  return (
    <Button
      variant={'ghost'}
      title={inMyList ? t('removeFromMyList') : t('addToMyList')}
      onClick={toggleMyList}
    >
      {inMyList ? <RemoveFromListIcon /> : <AddToListIcon />}
    </Button>
  );
}

export default MyListButton;
