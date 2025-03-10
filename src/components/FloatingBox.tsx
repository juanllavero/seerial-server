import React, { useEffect } from 'react'
import { Card, CardHeader } from './ui/card'
import { LibrarySwitcher } from './LibrarySwitcher'
import {
  Settings,
  Music,
  Film,
  TvMinimal,
  House,
  ChevronLeft,
} from 'lucide-react'
import { Button } from './ui/button'
import useDataStore from '@/context/data.context'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import useFetch from '@/hooks/useFetch'
import Loading from './Loading'

function FloatingBox({ isWindows }: { isWindows: boolean }) {
  const router = useRouter()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { libraries, setLibraries, selectLibrary, setLoadingLibraries } =
    useDataStore()
  const { serverIP } = useServerStore()
  const { fetchData, isLoading } = useFetch<Library[]>()

  // Check if current location is details page
  const location = useLocation()
  const inHome = location.pathname === '/'
  const inSettings = location.pathname === '/settings'

  useEffect(() => {
    if (serverIP !== '' && (!libraries || libraries.length === 0)) {
      setLoadingLibraries(true)

      fetchData(`https://${serverIP}/libraries`, (data) => {
        setLibraries(data)
        setLoadingLibraries(false)
      })
    }
  }, [])

  const home = {
    name: t('home'),
    logo: House,
    action: () => {
      selectLibrary(null)
      navigate({ to: '/' })
    },
  }

  return (
    <div className={`${isWindows ? 'pt-5' : 'pt-10'} pl-5`}>
      {router.parseLocation().pathname !== '/video-player' && (
        <Card>
          <CardHeader className="flex flex-row flex-nowrap justify-start p-3">
            {isLoading ? (
              <Loading />
            ) : (
              <LibrarySwitcher
                libraries={[
                  home,
                  ...libraries.map((library) => ({
                    name: library.name,
                    logo:
                      library.type === 'Shows'
                        ? TvMinimal
                        : library.type === 'Movies'
                          ? Film
                          : Music,
                    action: () => {
                      selectLibrary(library)
                      navigate({
                        to: '/collection/$libraryId',
                        params: { libraryId: library.id },
                      })
                    },
                  })),
                ]}
              />
            )}
            {!inHome && (
              <Button variant="ghost" onClick={() => router.history.back()}>
                <ChevronLeft />
              </Button>
            )}

            {!inSettings && (
              <Button
                variant="ghost"
                onClick={() => navigate({ to: '/settings' })}
              >
                <Settings />
              </Button>
            )}
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

export default React.memo(FloatingBox)
