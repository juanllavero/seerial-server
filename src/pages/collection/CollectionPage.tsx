import React from 'react'
import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import { useParams } from '@tanstack/react-router'
import CollectionCard from './components/CollectionCard'
import NotFound from '@/components/NotFound'
import Grid from '@/components/ui/Grid'

function CollectionPage() {
  const { libraryId } = useParams({ from: '/collection/$libraryId' })
  const { libraries, selectedLibrary, selectLibrary } = useDataStore()

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
