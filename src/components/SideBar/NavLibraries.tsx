import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { Library } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { t } from 'i18next'
import {
  EditIcon,
  Film,
  MoreVertical,
  Music,
  Plus,
  SearchIcon,
  Trash2,
  TvMinimal,
} from 'lucide-react'
import React, { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import Loading from '../Loading'
import SmallSpinner from './loading/SmallSpinner'

interface Item {
  id: string
  name: string
  type: string
  logo: React.ElementType
  action: () => void
}

const NavLibraries = () => {
  const { isMobile } = useSidebar()
  const { analyzing, analyzingLibraryId } = useWebSocketStore(
    (state) => ({
      analyzing: state.analyzing,
      analyzingLibraryId: state.analyzingLibraryId,
    }),
    shallow,
  )
  const navigate = useNavigate()

  const { selectedServer, serverUrl, serverStatus, apiKeyStatus } =
    useServerStore(
      (state) => ({
        selectedServer: state.selectedServer,
        serverUrl: state.serverUrl,
        serverStatus: state.serverStatus,
        apiKeyStatus: state.apiKeyStatus,
      }),
      shallow,
    )
  const { openLibraryDialog, openRemoveLibraryDialog } = useDialogStore(
    (state) => ({
      openLibraryDialog: state.openLibraryDialog,
      openRemoveLibraryDialog: state.openRemoveLibraryDialog,
    }),
    shallow,
  )
  const { selectedLibraryId, selectLibrary } = useDataStore(
    (state) => ({
      selectedLibraryId: state.selectedLibraryId,
      selectLibrary: state.selectLibrary,
    }),
    shallow,
  )

  const { data: libraries, isLoading } = useSWR<Library[]>(
    serverUrl !== '' ? `${serverUrl}/libraries/` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  const [activeItem, setActiveItem] = React.useState<Item | null>(null)

  React.useEffect(() => {
    if (librariesItems) {
      setActiveItem(
        librariesItems.find((item) => item.id === selectedLibraryId) || null,
      )
    }
  }, [selectedLibraryId])

  const librariesItems = libraries
    ? [
        ...libraries.map((library) => ({
          id: library.id,
          name: library.name,
          type: library.type,
          logo:
            library.type === LibraryTypes.SHOWS
              ? TvMinimal
              : library.type === LibraryTypes.MOVIES
                ? Film
                : Music,
          action: () => {
            selectLibrary(library.id)

            if (!selectedServer || !serverStatus) return

            navigate(
              `/server/${selectedServer.id}/library/${library.id}/${library.type}`,
            )
          },
        })),
      ]
    : []

  return (
    <>
      {isLoading || !libraries || libraries.length === 0 ? null : (
        <>
          {/* Separator */}
          <SidebarSeparator />

          {/* Libraries */}
          <SidebarGroup>
            <SidebarGroupLabel>{t('libraries')}</SidebarGroupLabel>
            <SidebarMenu>
              {librariesItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.name}>
                    <a
                      href={''}
                      className={`flex items-center gap-2 ${
                        activeItem && activeItem.id === item.id
                          ? 'bg-transparent'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveItem(item)

                        if (!selectedServer || !serverStatus) return

                        navigate(
                          `/server/${selectedServer.id}/library/${item.id}/${item.type}`,
                        )
                      }}
                      style={{
                        color:
                          activeItem && activeItem.id === item.id
                            ? 'var(--app-color)'
                            : '',
                      }}
                    >
                      {analyzingLibraryId === item.id && analyzing ? (
                        <SmallSpinner />
                      ) : (
                        <item.logo />
                      )}
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            activeItem && activeItem.id === item.id
                              ? 'var(--app-color)'
                              : '',
                        }}
                      >
                        {item.name}
                      </span>
                    </a>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreVertical />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 rounded-lg"
                      side={isMobile ? 'bottom' : 'right'}
                      align={isMobile ? 'end' : 'start'}
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          const library = libraries.find(
                            (library) => library.id === item.id,
                          )

                          if (library) {
                            openLibraryDialog(library)
                          }
                        }}
                      >
                        <EditIcon className="text-muted-foreground" />
                        <span>{t('editButton')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <SearchIcon className="text-muted-foreground" />
                        <span>{t('searchFiles')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openRemoveLibraryDialog(item.id)}
                      >
                        <Trash2 className="text-muted-foreground" />
                        <span>{t('removeLibrary')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </>
      )}

      {serverStatus && apiKeyStatus && (
        <>
          {/* Separator */}
          <SidebarSeparator />
          {/* Add Library */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={t('libraryWindowTitle')}
                  onClick={() => {
                    if (!analyzing) {
                      openLibraryDialog()
                    }
                  }}
                >
                  <a
                    href={''}
                    className="flex items-center gap-2"
                    style={{
                      color: !analyzing ? '' : '#999999',
                      cursor: !analyzing ? '' : 'not-allowed',
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    <Plus />
                    <span style={{ color: !analyzing ? '' : '#999999' }}>
                      {t('libraryWindowTitle')}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>{' '}
        </>
      )}
    </>
  )
}

export default memo(NavLibraries)
