import LoadingInsideSidebar from '@/components/LoadingInsideSidebar'
import { API } from '@/config/api'
import { useServerStore } from '@/context/auth.store'
import useDataStore from '@/context/data.context'
import { Library } from '@/data/interfaces/Media'
import { useGet } from '@/hooks/media/useGet'
import { useEffect } from 'react'
import { shallow } from 'zustand/shallow'
import NoAPIKey from './components/NoAPIKey'
import NoContent from './components/NoContent'
import HomePageContent from './components/content/HomePageContent'

export default function HomePage() {
  const { apiKeyStatus, gettingServerStatus } = useServerStore(
    (state) => ({
      apiKeyStatus: state.apiKeyStatus,
      gettingServerStatus: state.gettingApiKeyStatus,
    }),
    shallow,
  )
  const selectLibrary = useDataStore((state) => state.selectLibrary)

  // Get Libraries
  const { data: libraries, isLoading: loadingLibraries } = useGet<Library[]>(
    API.libraries.getAll,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  useEffect(() => {
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
