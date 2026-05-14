import type { Movie } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { useDialogStore } from '@/features/management';
import Card from '@/shared/cards/card';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Button } from '@/shared/ui/button';
import HorizontalList from '../../../../shared/lists/horizontal-list';
import HorizontalListSkeleton from './horizontal-list-skeleton';
import { useMediaActions } from '@/shared/lib/react-utils';

type MovieListItem = Movie;

const useGetMyListMovies = <TResponse,>() => ({
  data: [] as unknown as TResponse,
  isLoading: false,
  refetch: async () => undefined,
});

interface MyListMoviesProps {
  goToContent: (url: string) => void;
}

function MyListMovies({ goToContent }: MyListMoviesProps) {
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

  // Get Movies in My List
  const { data: moviesInMyList, isLoading, refetch } = useGetMyListMovies<MovieListItem[]>();
  const { refreshMetadata, toggleMovieWatched } = useMediaActions();

  return (
    <HorizontalList title={t('watchListMovies')}>
      {isLoading ? (
        <HorizontalListSkeleton listType="MyListMovies" />
      ) : moviesInMyList && moviesInMyList.length > 0 ? (
        moviesInMyList.map((movie: MovieListItem) => (
          <Card
            key={`Home Card ${movie.id}`}
            itemKey={`Home Card ${movie.id}`}
            imgSrc={movie.coverSrc}
            width={isMobile ? 130 : 180}
            aspectRatio={2 / 3}
            title={movie.name}
            subtitle={movie.year ? new Date(movie.year).getFullYear().toString() : 'N/A'}
            watched={
              movie.watchLists?.some((list) => list.userId === user?.id && list.watched) ?? false
            }
            menu={{
              items: [
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeFromMyList'),
                      action: async () => {
                        if (user) {
                          await toggleMovieWatched(movie.id, false, user.id);
                        }
                        void refetch();
                      },
                    },
                    {
                      title: t('updateMetadata'),
                      action: () => refreshMetadata('movie', movie.id),
                    },
                    {
                      title: t('correctIdentification'),
                      action: () => openDialog('identification', { movieId: movie.id }),
                    },
                    {
                      title: movie.watchLists?.some(
                        (list) => list.userId === user?.id && list.watched,
                      )
                        ? t('markUnwatched')
                        : t('markWatched'),

                      action: () =>
                        user &&
                        toggleMovieWatched(
                          movie.id,
                          !movie.watchLists?.some(
                            (list) => list.userId === user?.id && list.watched,
                          ),
                          user.id,
                        ),
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
            editModal={
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={(e) => {
                  e.stopPropagation();
                  openDialog('movie', { id: movie.id });
                }}
              >
                <Pencil size={16} />
              </Button>
            }
            hidePlayButton
            action={() => goToContent(`/movie/${movie.id}`)}
          />
        ))
      ) : (
        t('noContent')
      )}
    </HorizontalList>
  );
}

export default MyListMovies;
