import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import useDataStore from '@/context/data.context'
import { useParams } from '@tanstack/react-router'
import React from 'react'
import CollectionCard from './components/CollectionCard'

function CollectionPage() {
  const { libraryId } = useParams({ from: '/collection/$libraryId' })
  const { libraries, selectedLibrary, selectLibrary } = useDataStore()
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  //#region CHECK DATA BEFORE LOAD
  const library = libraries.find((library) => library.id === libraryId)

  if (libraryId !== selectedLibrary?.id) {
    if (library) {
      selectLibrary(library)
    } else {
      return <NotFound />
    }
  }

  if (!selectedLibrary) {
    return <NotFound />
  }
  //#endregion

  // Clear series and season selection on load
  // useEffect(() => {
  //   selectSeries(null)
  //   selectSeason(null)
  // }, [])

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
        {selectedLibrary.series.map((series) => (
          <CollectionCard
            library={selectedLibrary}
            series={series}
            key={series.id}
          />
        ))}
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
      {selectedLibrary.series.map((series) => (
        <CollectionCard
          library={selectedLibrary}
          series={series}
          key={series.id}
        />
      ))}
    </FlexBox>
  )
  // return (
  //   <Grid
  //     columns="repeat(auto-fill, minmax(200px, 1fr))"
  //     gap="1rem"
  //     padding="8rem 2rem"
  //     height={'100%'}
  //   >
  //     {selectedLibrary.series.map((series) => (
  //       <CollectionCard
  //         library={selectedLibrary}
  //         series={series}
  //         key={series.id}
  //       />
  //     ))}
  //   </Grid>
  // )
}

export default CollectionPage
