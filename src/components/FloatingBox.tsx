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
import React from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import DropdownWrapper from './DropdownWrapper'
import { useIsMobile } from './hooks/use-mobile'
import { LibrarySwitcher } from './LibrarySwitcher'
import Loading from './Loading'
import NotFound from './NotFound'
import { Button } from './ui/button'
import { Card, CardHeader } from './ui/card'

function FloatingBox({ isWindows }: { isWindows: boolean }) {
  const router = useRouter()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { openRemoveLibraryDialog } = useDialogStore()
  const { selectedLibraryId, selectLibrary } = useDataStore()
  const { serverIP } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const isMobile = useIsMobile()

  const { data: libraries, isLoading } = useSWR<Library[]>(
    `http://${serverIP}/libraries/`,
    fetcher,
  )

  // Checks current page location
  const location = useLocation()
  const inHome = location.pathname === '/'
  const inSettings = location.pathname === '/settings'
  const inPlayer = location.pathname.startsWith('/video-player')

  const getLibraryDrowdown = (): DropdownContent => {
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
                  `http://${serverIP}/library/search?libraryId=${selectedLibraryId}`,
                )
              },
            },
            {
              title: t('updateMetadata'),
              action: async () => {
                await connectWS(serverIP)
                fetch(
                  `http://${serverIP}/library/updateMetadata?libraryId=${selectedLibraryId}`,
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

  if (isLoading) {
    return <Loading />
  }

  if (!libraries) {
    return <NotFound />
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
                      selectLibrary(library.id)
                      navigate({
                        to: '/library/$libraryId',
                        params: { libraryId: library.id },
                      })
                    },
                  })),
                ]}
              />
            )}

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
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

export default React.memo(FloatingBox)
