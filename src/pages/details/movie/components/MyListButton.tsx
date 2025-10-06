import { Button } from '@/components/ui/button'
import { AddToListIcon, RemoveFromListIcon } from '@/components/ui/IconLibrary'
import { useServerStore } from '@/context/server.context'
import { authenticatedFetch, authenticatedFetcher } from '@/lib/auth'
import { t } from 'i18next'
import useSWR from 'swr'

interface MyListButtonProps {
  movieId: string
  serverUrl: string
}

function MyListButton({ movieId, serverUrl }: MyListButtonProps) {
  const user = useServerStore((state) => state.currentUser)
  // Get if movie is in My List
  const { data: inMyList, mutate: mutateInMyList } = useSWR(
    `${serverUrl}/isMovieInMyList?movieId=${movieId}&userId=${user?.id}`,
    authenticatedFetcher,
  )

  const toggleMyList = () => {
    authenticatedFetch(`${serverUrl}/updateMovieMyList`, 'POST', {
      movieId: movieId,
      userId: user?.id,
    }).then(() => {
      mutateInMyList()
    })
  }
  return (
    <Button
      variant={'ghost'}
      title={
        inMyList && inMyList.isInMyList
          ? t('removeFromMyList')
          : t('addToMyList')
      }
      onClick={toggleMyList}
    >
      {inMyList && inMyList.isInMyList ? (
        <RemoveFromListIcon />
      ) : (
        <AddToListIcon />
      )}
    </Button>
  )
}

export default MyListButton
