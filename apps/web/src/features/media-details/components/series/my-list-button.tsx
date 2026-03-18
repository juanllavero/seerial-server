import { API, useCreate, useIsSeriesInMyList } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { t } from 'i18next';
import { Button } from '@/shared/ui/button';
import { AddToListIcon, RemoveFromListIcon } from '@/shared/ui/icon-library';

interface InMyListResponse {
  isInMyList: boolean;
}

interface MyListButtonProps {
  seriesId: string;
}

function MyListButton({ seriesId }: MyListButtonProps) {
  const user = useServerStore((state) => state.currentUser);
  const { create } = useCreate<unknown>();
  // Get if show is in My List
  const { data: inMyList, refetch } = useIsSeriesInMyList<InMyListResponse>(seriesId);

  const toggleMyList = async () => {
    await create(API.myList.series, {
      seriesId: seriesId,
      userId: user?.id,
    });
    void refetch();
  };
  return (
    <Button
      variant={'ghost'}
      title={inMyList?.isInMyList ? t('removeFromMyList') : t('addToMyList')}
      onClick={toggleMyList}
    >
      {inMyList?.isInMyList ? <RemoveFromListIcon /> : <AddToListIcon />}
    </Button>
  );
}

export default MyListButton;
