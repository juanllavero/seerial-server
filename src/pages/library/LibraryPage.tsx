import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useParams } from '@tanstack/react-router'
import React, { useEffect } from 'react'
import useSWR from 'swr'
import AlbumList from './components/lists/AlbumList'
import MoviesList from './components/lists/MoviesList'
import SeriesList from './components/lists/SeriesList'

function LibraryPage() {
  const { libraryId } = useParams({ from: '/library/$libraryId' })
  const { serverIP } = useServerStore()
  const { selectedLibraryId, selectLibrary } = useDataStore()
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  const { data: library, isLoading } = useSWR<Library>(
    libraryId ? `http://${serverIP}/library?id=${libraryId}` : null,
    fetcher,
  )

  useEffect(() => {
    if (library) {
      selectLibrary(library.id)
    }
  }, [library])

  if (libraryId !== selectedLibraryId) {
    if (library) {
      selectLibrary(library.id)
    } else {
      return <NotFound />
    }
  }

  if (!library || isLoading) {
    return <Loading />
  }

  const ItemsList = () =>
    library?.type === 'Music' ? (
      <AlbumList library={library} />
    ) : library?.type === 'Shows' ? (
      <SeriesList library={library} />
    ) : (
      <MoviesList library={library} />
    )

  if (isTablet || isMobile) {
    return (
      <Grid
        columns={isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'}
        gap="1rem"
        padding="8rem 1rem"
        height={'100%'}
        scroll="vertical"
        hideScrollbar
      >
        <ItemsList />
      </Grid>
    )
  }

  return (
    <FlexBox
      gap={1}
      wrap="wrap"
      padding="8rem 2rem"
      scroll="vertical"
      height={'100%'}
    >
      <ItemsList />
    </FlexBox>
  )
}

export default LibraryPage
