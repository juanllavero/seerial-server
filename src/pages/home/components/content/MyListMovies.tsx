import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { authenticatedFetch } from '@/lib/auth'
import { refreshMetadata, toggleMovieWatched } from '@/utils/ReactUtils'
import { authenticatedFetcher } from '@/utils/utils'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import HorizontalList from '../../../../components/lists/HorizontalList'
import HorizontalListSkeleton from './HorizontalListSkeleton'

interface MyListMoviesProps {
  goToContent: (url: string) => void
}

function MyListMovies({ goToContent }: MyListMoviesProps) {
  const { t } = useTranslation()
  const { openIdentificationDialog, openMovieDialog } = useDialogStore(
    (state) => ({
      openIdentificationDialog: state.openIdentificationDialog,
      openMovieDialog: state.openMovieDialog,
    }),
    shallow,
  )
  const { user, serverUrl } = useServerStore(
    (state) => ({
      user: state.currentUser,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const isMobile = useIsMobile()

  // Get Movies in My List
  const { data: moviesInMyList, isLoading } = useSWR<Movie[]>(
    serverUrl !== ''
      ? `${serverUrl}/myListMovies?userId=${user?.id ?? null}`
      : null,
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
            subtitle={
              movie.year ? new Date(movie.year).getFullYear().toString() : 'N/A'
            }
            watched={movie.watchStatus !== undefined}
            menu={{
              items: [
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeFromMyList'),
                      action: () => {
                        authenticatedFetch(
                          `${serverUrl}/updateMovieMyList`,
                          'POST',
                          {
                            movieId: movie.id,
                            userId: user?.id,
                          },
                        ).then(() => {
                          mutate((key: string) =>
                            key.startsWith(`${serverUrl}/myListMovies`),
                          )
                        })
                      },
                    },
                    {
                      title: t('updateMetadata'),
                      action: () => refreshMetadata('movie', movie.id),
                    },
                    {
                      title: t('correctIdentification'),
                      action: () => openIdentificationDialog(undefined, movie),
                    },
                    {
                      title:
                        movie.watchStatus !== undefined
                          ? t('markUnwatched')
                          : t('markWatched'),

                      action: () =>
                        user && toggleMovieWatched(serverUrl, movie, user.id),
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
                  openMovieDialog(movie)
                }}
              >
                <Pencil size={16} />
              </Button>
            }
            hidePlayButton
            action={() => goToContent(`/details/movie/${movie.id}`)}
          />
        ))
      ) : (
        t('noContent')
      )}
    </HorizontalList>
  )
}

export default MyListMovies
