import { API, useCreate, useIsSeriesInMyList } from '@seerial/api';
import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { AddToListIcon, RemoveFromListIcon } from '@/components/ui/IconLibrary';
import { useServerStore } from '@seerial/stores';

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
