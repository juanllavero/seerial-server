import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import HorizontalList from '../../../../components/lists/HorizontalList'
import HorizontalListSkeleton from './HorizontalListSkeleton'
import { shallow } from 'zustand/shallow'
import { toggleMovieWatched } from '@/utils/ReactUtils'
import { useDialogStore } from '@/context/dialog.context'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/context/auth.context'

interface MyListMoviesProps {
  goToContent: (url: string) => void
}

function MyListMovies({ goToContent }: MyListMoviesProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openIdentificationDialog, openMovieDialog } = useDialogStore(
    (state) => ({
      openIdentificationDialog: state.openIdentificationDialog,
      openMovieDialog: state.openMovieDialog,
    }),
    shallow,
  )
  const { selectedServer, serverUrl } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const isMobile = useIsMobile()

  // Get Movies in My List
  const { data: moviesInMyList, isLoading } = useSWR<Movie[]>(
    selectedServer
      ? `${serverUrl}/myListMovies?userId=${user?.id ?? null}`
      : null,
    fetcher,
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
            watched={movie.watched}
            menu={{
              items: [
                {
                  separator: false,
                  items: [
                    {
                      title: t('removeFromMyList'),
                      action: () => {
                        fetch(`${serverUrl}/updateMovieMyList`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            movieId: movie.id,
                            userId: user?.id,
                          }),
                        }).then(() => {
                          mutate((key: string) =>
                            key.startsWith(`${serverUrl}/myListMovies`),
                          )
                        })
                      },
                    },
                    {
                      title: t('updateMetadata'),
                      action: () => console.log('Profile clicked'),
                    },
                    {
                      title: t('correctIdentification'),
                      action: () => openIdentificationDialog(undefined, movie),
                    },
                    {
                      title: movie.watched
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
            action={() =>
              goToContent(
                `/server/${selectedServer?.id}/details/movie/${movie.id}`,
              )
            }
          />
        ))
      ) : (
        t('noContent')
      )}
    </HorizontalList>
  )
}

export default MyListMovies
