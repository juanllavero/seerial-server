import { API, useCreate, useIsMovieInMyList } from '@seerial/api';
import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { AddToListIcon, RemoveFromListIcon } from '@/components/ui/IconLibrary';
import { useServerStore } from '@seerial/stores';

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
