import { useAuth } from '@/context/auth.context'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Library } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { fetcher } from '@/utils/utils'
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
import useSWR from 'swr'
import DropdownWrapper from './DropdownWrapper'
import { useIsMobile } from './hooks/use-mobile'
import { LibrarySwitcher } from './LibrarySwitcher'
import { Button } from './ui/button'
import { Card, CardHeader } from './ui/card'
import LazyImage from './ui/LazyImage'

function FloatingBox({ isWindows }: { isWindows: boolean }) {
  const router = useRouter()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openRemoveLibraryDialog } = useDialogStore()
  const { selectedLibraryId, selectLibrary, setIsContent, setLoadingContent } =
    useDataStore()
  const { selectedServer } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const isMobile = useIsMobile()

  const { data: libraries, isLoading } = useSWR<Library[]>(
    selectedServer ? `https://${selectedServer.ip}/libraries/` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  // Checks current page location
  const location = useLocation()
  const inHome = location.pathname === '/'
  const inSettings = location.pathname === '/settings'
  const inPlayer = location.pathname.startsWith('/video-player')

  // Update global state variables
  useEffect(() => {
    setLoadingContent(isLoading)
    setIsContent(!isLoading && libraries !== undefined && libraries.length > 0)
  }, [libraries, isLoading])

  const getLibraryDrowdown = (): DropdownContent => {
    return {
      items: [
        {
          separator: false,
          items: [
            {
              title: t('searchFiles'),
              action: async () => {
                if (!selectedServer) return

                const serverIP = selectedServer?.ip
                await connectWS(serverIP)
                fetch(
                  `https://${serverIP}/library/search?libraryId=${selectedLibraryId}`,
                )
              },
            },
            {
              title: t('updateMetadata'),
              action: async () => {
                if (!selectedServer) return

                const serverIP = selectedServer?.ip
                await connectWS(serverIP)
                fetch(
                  `https://${serverIP}/library/updateMetadata?libraryId=${selectedLibraryId}`,
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
                openRemoveLibraryDialog(selectedLibraryId ?? '')
              },
            },
          ],
        },
      ],
    }
  }

  return (
    <div
      className={`flex w-full flex-row justify-between px-5 pl-5 ${isMobile ? 'pt-5' : isWindows ? 'pt-5' : 'pt-10'}`}
    >
      {!inPlayer && (
        <>
          {/* Left Card */}
          <Card>
            <CardHeader className="flex flex-row flex-nowrap justify-between p-3">
              <LibrarySwitcher
                libraries={
                  libraries
                    ? [
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
                            selectLibrary(library.id)
                            navigate({
                              to: '/library/$libraryId',
                              params: { libraryId: library.id },
                            })
                          },
                        })),
                      ]
                    : []
                }
              />
            </CardHeader>
          </Card>

          {/* Right Card */}
          <Card>
            <CardHeader className="flex flex-row flex-nowrap justify-between p-3">
              {selectedLibraryId && (
                <DropdownWrapper
                  content={getLibraryDrowdown()}
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

              <Button>
                <LazyImage src={user ? user.image : ''} rounded width={40} />
              </Button>
            </CardHeader>
          </Card>
        </>
      )}
    </div>
  )
}

export default React.memo(FloatingBox)
