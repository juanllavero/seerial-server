import Loading from '@/components/Loading'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import { Server } from '@/data/interfaces/Users'
import {
  CENTRAL_SERVER,
  SIDEBAR_MARGIN,
  SIDEBAR_MARGIN_COLLAPSED,
} from '@/utils/constants'
import { authenticatedFetcher } from '@/utils/utils'
import { useEffect } from 'react'
import useSWR from 'swr'
import NoAPIKey from './components/NoAPIKey'
import NoContent from './components/NoContent'
import NoServer from './components/NoServer'
import NotAvailableServer from './components/NotAvailableServer'
import HomePageContent from './components/content/HomePageContent'
import { shallow } from 'zustand/shallow'
import { useSidebar } from '@/components/ui/sidebar'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'
import LoadingInsideSidebar from '@/components/LoadingInsideSidebar'

export default function HomePage() {
  const { state: sidebarState } = useSidebar()
  const {
    selectedServer,
    serverUrl,
    serverStatus,
    apiKeyStatus,
    gettingServerStatus,
    getServerStatus,
  } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      serverUrl: state.serverUrl,
      serverStatus: state.serverStatus,
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
    getServerStatus()
    selectLibrary(null)
  }, [])

  if (loadingLibraries || gettingServerStatus) {
    return <LoadingInsideSidebar />
  }

  if (!serverUrl) {
    return <NoServer />
  }

  if (!serverStatus) {
    return <NotAvailableServer />
  }

  if (!apiKeyStatus) {
    return <NoAPIKey />
  }

  const visibleLibraries = libraries
    ? selectedServer?.shared
      ? libraries.filter((library) =>
          selectedServer.libraries?.includes(library.id),
        )
      : libraries
    : []

  if (!visibleLibraries || visibleLibraries.length === 0) {
    return <NoContent />
  }

  return <HomePageContent />
}
