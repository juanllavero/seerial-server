import Loading from '@/components/Loading'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import { Server } from '@/data/interfaces/Users'
import { CENTRAL_SERVER } from '@/utils/constants'
import { authenticatedFetcher } from '@/utils/utils'
import { useEffect } from 'react'
import useSWR from 'swr'
import NoAPIKey from './components/NoAPIKey'
import NoContent from './components/NoContent'
import NoServer from './components/NoServer'
import NotAvailableServer from './components/NotAvailableServer'
import HomePageContent from './components/content/HomePageContent'
import { shallow } from 'zustand/shallow'
import { useAuth } from '@/context/auth.context'

export default function HomePage() {
  const { serverIP, serverStatus, apiKeyStatus, getServerStatus } =
    useServerStore(
      (state) => ({
        serverIP: state.serverIP,
        serverStatus: state.serverStatus,
        apiKeyStatus: state.apiKeyStatus,
        getServerStatus: state.getServerStatus,
      }),
      shallow,
    )
  const selectLibrary = useDataStore((state) => state.selectLibrary)

  // Get Libraries
  const { data: libraries, isLoading: loadingLibraries } = useSWR<Library[]>(
    serverIP !== '' ? `http://${serverIP}/libraries/` : null,
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

  if (loadingLibraries) {
    return <Loading />
  }

  if (!serverIP) {
    return <NoServer />
  }

  if (!serverStatus) {
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
