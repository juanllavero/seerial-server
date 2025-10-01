import LoadingInsideSidebar from '@/components/LoadingInsideSidebar'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import { authenticatedFetcher } from '@/utils/utils'
import { useEffect } from 'react'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import NoAPIKey from './components/NoAPIKey'
import NoContent from './components/NoContent'
import NoServer from './components/NoServer'
import NotAvailableServer from './components/NotAvailableServer'
import HomePageContent from './components/content/HomePageContent'

export default function HomePage() {
  const {
    serverUrl,
    server,
    apiKeyStatus,
    gettingServerStatus,
    getServerStatus,
  } = useServerStore(
    (state) => ({
      serverUrl: state.serverUrl,
      server: state.server,
      apiKeyStatus: state.apiKeyStatus,
      gettingServerStatus: state.gettingServerStatus,
      getServerStatus: state.getServerStatus,
    }),
    shallow,
  )
  const selectLibrary = useDataStore((state) => state.selectLibrary)

  // Get Libraries
  const { data: libraries, isLoading: loadingLibraries } = useSWR<Library[]>(
    serverUrl !== '' ? `${serverUrl}/libraries/` : null,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  useEffect(() => {
    getServerStatus(serverUrl)
    selectLibrary(null)
  }, [])

  if (loadingLibraries || gettingServerStatus) {
    return <LoadingInsideSidebar />
  }

  if (!serverUrl) {
    return <NoServer />
  }

  if (!server) {
    return <NotAvailableServer />
  }

  if (!apiKeyStatus) {
    return <NoAPIKey />
  }

  if (!libraries || libraries.length === 0) {
    return <NoContent />
  }

  return <HomePageContent />
}
