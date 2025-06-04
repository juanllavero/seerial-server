import { Button } from '@/components/ui/button'
import { RemoveFromListIcon, AddToListIcon } from '@/components/ui/IconLibrary'
import { fetcher } from '@/utils/utils'
import { t } from 'i18next'
import React from 'react'
import useSWR from 'swr'

interface MyListButtonProps {
  movieId: string
  serverIP: string
}

function MyListButton({ movieId, serverIP }: MyListButtonProps) {
  // Get if movie is in My List
  const { data: inMyList, mutate: mutateInMyList } = useSWR(
    `https://${serverIP}/isMovieInMyList?movieId=${movieId}`,
    fetcher,
  )

  const toggleMyList = () => {
    fetch(`https://${serverIP}/updateMovieMyList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movieId: movieId,
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
