import { API, useCreate, useIsMovieInMyList } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { t } from 'i18next';
import { Button } from '@/shared/ui/button';
import { AddToListIcon, RemoveFromListIcon } from '@/shared/ui/icon-library';

interface InMyListResponse {
  isInMyList: boolean;
}

interface MyListButtonProps {
  movieId: string;
}

function MyListButton({ movieId }: MyListButtonProps) {
  const user = useServerStore((state) => state.currentUser);
  const { create } = useCreate<unknown>();
  // Get if movie is in My List
  const { data: inMyList, refetch } = useIsMovieInMyList<InMyListResponse>(movieId);

  const toggleMyList = async () => {
    await create(API.myList.movies, {
      movieId: movieId,
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
