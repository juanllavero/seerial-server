import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Library } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import useFetch from '@/hooks/useFetch'
import { useLocation, useNavigate, useRouter } from '@tanstack/react-router'
import {
  ChevronLeft,
  EllipsisVertical,
  Film,
  Music,
  Settings,
  TvMinimal,
} from 'lucide-react'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DropdownWrapper from './DropdownWrapper'
import { useIsMobile } from './hooks/use-mobile'
import { LibrarySwitcher } from './LibrarySwitcher'
import Loading from './Loading'
import { Button } from './ui/button'
import { Card, CardHeader } from './ui/card'

function FloatingBox({ isWindows }: { isWindows: boolean }) {
  const router = useRouter()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { openRemoveLibraryDialog } = useDialogStore()
  const {
    libraries,
    setLibraries,
    selectedLibrary,
    selectLibrary,
    setLoadingLibraries,
  } = useDataStore()
  const { serverIP } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { fetchData, isLoading } = useFetch<Library[]>()
  const isMobile = useIsMobile()

  // Checks current page location
  const location = useLocation()
  const inHome = location.pathname === '/'
  const inSettings = location.pathname === '/settings'
  const inPlayer = location.pathname.startsWith('/video-player')

  useEffect(() => {
    if (serverIP !== '' && (!libraries || libraries.length === 0)) {
      setLoadingLibraries(true)

      fetchData(`http://${serverIP}/libraries`, (data) => {
        setLibraries(data)
        setLoadingLibraries(false)
      })
    }
  }, [])

  const getLibraryDrowdown = (library: Library): DropdownContent => {
    return {
      items: [
        {
          separator: false,
          items: [
            {
              title: t('searchFiles'),
              action: async () => {
                await connectWS(serverIP)
                fetch(
                  `http://${serverIP}/library/search?libraryId=${library.id}`,
                )
              },
            },
            {
              title: t('updateMetadata'),
              action: async () => {
                await connectWS(serverIP)
                fetch(
                  `http://${serverIP}/library/updateMetadata?libraryId=${library.id}`,
                )
              },
            },
          ],
        },
        { separator: true, items: [] },
        {
          separator: false,
          items: [
            {
              title: t('removeButton'),
              action: () => {
                openRemoveLibraryDialog(library)
              },
            },
          ],
        },
      ],
    }
  }

  return (
    <div
      className={`pl-5 ${isMobile ? 'w-full px-5 pt-5' : isWindows ? 'pt-5' : 'pt-10'}`}
    >
      {!inPlayer && (
        <Card>
          <CardHeader className="flex flex-row flex-nowrap justify-start p-3">
            {isLoading ? (
              <Loading />
            ) : (
              <LibrarySwitcher
                libraries={[
                  ...libraries.map((library) => ({
                    id: library.id,
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

            {selectedLibrary && (
              <DropdownWrapper
                content={getLibraryDrowdown(selectedLibrary)}
                button={
                  <Button variant={'ghost'} size={'icon'}>
                    <EllipsisVertical />
                  </Button>
                }
              />
            )}

            {!inHome && (
              <Button
                variant="ghost"
                size={'icon'}
                onClick={() => router.history.back()}
              >
                <ChevronLeft />
              </Button>
            )}

            {!inSettings && (
              <Button
                variant="ghost"
                size={'icon'}
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
