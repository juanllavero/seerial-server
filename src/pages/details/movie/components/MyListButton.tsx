import { Button } from '@/components/ui/button'
import { RemoveFromListIcon, AddToListIcon } from '@/components/ui/IconLibrary'
import { useAuth } from '@/context/auth.context'
import { fetcher } from '@/utils/utils'
import { t } from 'i18next'
import useSWR from 'swr'

interface MyListButtonProps {
  movieId: string
  serverUrl: string
}

function MyListButton({ movieId, serverUrl }: MyListButtonProps) {
  const { user } = useAuth()
  // Get if movie is in My List
  const { data: inMyList, mutate: mutateInMyList } = useSWR(
    `${serverUrl}/isMovieInMyList?movieId=${movieId}&userId=${user?.id}`,
    fetcher,
  )

  const toggleMyList = () => {
    fetch(`${serverUrl}/updateMovieMyList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movieId: movieId,
        userId: user?.id,
      }),
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
