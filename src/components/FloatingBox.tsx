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
  EllipsisVertical,
} from 'lucide-react'
import { Button } from './ui/button'
import useDataStore from '@/context/data.context'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import useFetch from '@/hooks/useFetch'
import Loading from './Loading'
import { DropdownContent } from '@/data/interfaces/Utils'
import DropdownWrapper from './DropdownWrapper'
import { useDialogStore } from '@/context/dialog.context'

function FloatingBox({ isWindows }: { isWindows: boolean }) {
  const router = useRouter()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { openRemoveLibraryDialog } = useDialogStore()
  const { libraries, setLibraries, selectedLibrary, selectLibrary, setLoadingLibraries } =
    useDataStore()
  const { serverIP } = useServerStore()
  const { fetchData, isLoading } = useFetch<Library[]>()

  // Checks current page location
  const location = useLocation()
  const inHome = location.pathname === '/'
  const inSettings = location.pathname === '/settings'
  const inPlayer = location.pathname.startsWith('/video-player')

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
    id: '0',
    name: t('home'),
    logo: House,
    action: () => {
      selectLibrary(null)
      navigate({ to: '/' })
    },
  }

  const getLibraryDrowdown = (library: Library): DropdownContent => {
    return {
      items: [
        {
          separator: false,
          items: [
            {
              title: 'Profile',
              action: () => console.log('Profile clicked'),
            },
            {
              title: 'Billing',
              action: () => console.log('Billing clicked'),
            },
            {
              title: 'Settings',
              action: () => console.log('Settings clicked'),
            },
            {
              title: 'Keyboard shortcuts',
              action: () => console.log('Keyboard shortcuts clicked'),
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
    <div className={`${isWindows ? 'pt-5' : 'pt-10'} pl-5`}>
      {!inPlayer && (
        <Card>
          <CardHeader className="flex flex-row flex-nowrap justify-start p-3">
            {isLoading ? (
              <Loading />
            ) : (
              <LibrarySwitcher
                libraries={[
                  home,
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
                    }
                  })),
                ]}
              />
            )}

            {selectedLibrary && (
              <DropdownWrapper content={getLibraryDrowdown(selectedLibrary)} button={<Button variant={'ghost'}><EllipsisVertical /></Button>} />
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
