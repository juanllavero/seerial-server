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

export default function HomePage() {
  const { selectedServer, serverStatus, apiKeyStatus, getServerStatus } =
    useServerStore()
  const { selectLibrary } = useDataStore()

  // Get Servers
  const { data: servers, isLoading: loadingServers } = useSWR<Server[]>(
    `https://${CENTRAL_SERVER}/servers/`,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  // Get Libraries
  const { data: libraries, isLoading: loadingLibraries } = useSWR<Library[]>(
    selectedServer ? `https://${selectedServer.ip}/libraries/` : null,
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

  if (loadingServers || loadingLibraries) {
    return <Loading />
  }

  if (!servers) {
    return <NoServer />
  }

  if (!serverStatus) {
    return <NotAvailableServer />
  }

  if (!apiKeyStatus) {
    return <NoAPIKey />
  }

  if (!libraries) {
    return <NoContent />
  }

  return <HomePageContent />
}
