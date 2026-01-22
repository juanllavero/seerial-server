import LoadingInsideSidebar from '@/components/LoadingInsideSidebar'
import { API, authenticatedFetcher } from '@/config/api'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import { APIResponse } from '@/data/interfaces/Utils'
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
  const { data, isLoading: loadingLibraries } = useSWR<APIResponse<Library[]>>(
    API.libraries.getAll,
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

  if (!data || data.data.length === 0) {
    return <NoContent />
  }

  return <HomePageContent />
}
