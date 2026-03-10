import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { API, authenticatedFetch, authenticatedFetcher } from '@/config/api'
import { useServerStore } from '@/context/auth.store'
import { useDialogStore } from '@/context/dialog.store'
import type { Movie } from '@/data/interfaces/Media'
import { refreshMetadata, toggleMovieWatched } from '@/utils/ReactUtils'
import HorizontalList from '../../../../components/lists/HorizontalList'
import HorizontalListSkeleton from './HorizontalListSkeleton'

interface MyListMoviesProps {
  goToContent: (url: string) => void
}

function MyListMovies({ goToContent }: MyListMoviesProps) {
  const { t } = useTranslation()
  const { openDialog } = useDialogStore(
    (state) => ({
      openDialog: state.openDialog,
    }),
    shallow,
  )

  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  )
  const isMobile = useIsMobile()

  // Get Movies in My List
  const { data: moviesInMyList, isLoading } = useSWR<Movie[]>(
    API.myList.movies,
    authenticatedFetcher,
  )

  return (
    <HorizontalList title={t('watchListMovies')}>
      {isLoading ? (
        <HorizontalListSkeleton listType="MyListMovies" />
      ) : moviesInMyList && moviesInMyList.length > 0 ? (
        moviesInMyList.map((movie: Movie) => (
          <Card
            itemKey={'Home Card' + movie.id}
            imgSrc={movie.coverSrc}
            width={isMobile ? 130 : 180}
            aspectRatio={2 / 3}
            title={movie.name}
            subtitle={movie.year ? new Date(movie.year).getFullYear().toString() : 'N/A'}
            watched={movie.watchStatus !== undefined}
            menu={{
              items: [
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeFromMyList'),
                      action: () => {
                        authenticatedFetch(API.myList.movies, 'POST', {
                          movieId: movie.id,
                          userId: user?.id,
                        }).then(() => {
                          mutate((key: string) => key.startsWith(API.myList.movies))
                        })
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
                      title:
                        movie.watchStatus !== undefined ? t('markUnwatched') : t('markWatched'),

                      action: () =>
                        user && toggleMovieWatched(movie.id, !movie.watchStatus, user.id),
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
                  e.stopPropagation()
                  openDialog('movie', { id: movie.id })
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
  )
}

export default MyListMovies
