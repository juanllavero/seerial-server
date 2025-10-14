import LoadingInsideSidebar from '@/components/LoadingInsideSidebar'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import { authenticatedFetcher } from '@/lib/auth'
import { useEffect } from 'react'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import NoAPIKey from './components/NoAPIKey'
import NoContent from './components/NoContent'
import HomePageContent from './components/content/HomePageContent'

export default function HomePage() {
  const { apiKeyStatus, gettingServerStatus, getServerStatus } = useServerStore(
    (state) => ({
      apiKeyStatus: state.apiKeyStatus,
      gettingServerStatus: state.gettingServerStatus,
      getServerStatus: state.getServerStatus,
    }),
    shallow,
  )
  const selectLibrary = useDataStore((state) => state.selectLibrary)

  // Get Libraries
  const { data: libraries, isLoading: loadingLibraries } = useSWR<Library[]>(
    '/api/libraries/',
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  useEffect(() => {
    getServerStatus()
    selectLibrary(null)
  }, [])

  if (loadingLibraries || gettingServerStatus) {
    return <LoadingInsideSidebar />
  }

  if (!apiKeyStatus) {
    return <NoAPIKey />
  }

  if (!libraries || libraries.length === 0) {
    return <NoContent />
  }

  return <HomePageContent />
}
