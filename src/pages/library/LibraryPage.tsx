import LoadingInsideSidebar from '@/components/LoadingInsideSidebar'
import { API, authenticatedFetcher } from '@/config/api'
import useDataStore from '@/context/data.context'
import { Library } from '@/data/interfaces/Media'
import NoContent from '@/pages/home/components/NoContent'
import { memo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import LibraryContent from './components/LibraryContent'

function LibraryPage() {
  const { libraryId } = useParams()
  const { selectedLibraryId, selectLibrary } = useDataStore(
    (state) => ({
      selectedLibraryId: state.selectedLibraryId,
      selectLibrary: state.selectLibrary,
    }),
    shallow,
  )
  const {
    data: library,
    isLoading,
    mutate,
  } = useSWR<Library>(
    libraryId ? API.libraries.getById(libraryId) : null,
    authenticatedFetcher,
  )

  useEffect(() => {
    if (library && library.id !== selectedLibraryId) {
      selectLibrary(library.id)
    }
  }, [library?.id, selectedLibraryId, selectLibrary])

  if (isLoading) {
    return <LoadingInsideSidebar />
  }

  if (!library) {
    return <NoContent />
  }

  return <LibraryContent library={library} mutateLibrary={mutate} />
}

export default memo(LibraryPage)
