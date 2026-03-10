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
import { API, authenticatedFetch, authenticatedFetcher } from '@/config/api'
import { useServerStore } from '@/context/auth.store'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.store'
import { useWebSocketStore } from '@/context/ws.context'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import type { Library } from '@/data/interfaces/Media'
import type { APIResponse } from '@/data/interfaces/Utils'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { t } from 'i18next'
import {
  Film,
  MoreVertical,
  Music,
  Pencil,
  Plus,
  SearchIcon,
  Trash2,
  TvMinimal,
} from 'lucide-react'
import React, { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
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
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { analyzing, analyzingLibraryId } = useWebSocketStore(
    (state) => ({
      analyzing: state.analyzing,
      analyzingLibraryId: state.analyzingLibraryId,
    }),
    shallow,
  )
  const navigate = useNavigate()

  const isAdmin = useIsAdmin()
  const { apiKeyStatus } = useServerStore(
    (state) => ({
      apiKeyStatus: state.apiKeyStatus,
    }),
    shallow,
  )
  const { openDialog } = useDialogStore(
    (state) => ({
      openDialog: state.openDialog,
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

  const { data, isLoading } = useSWR<APIResponse<Library[]>>(
    API.libraries.getAll,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  const libraries = data ? data.data : []

  const searchFiles = async (libraryId: string) => {
    await connectWS()

    authenticatedFetch(API.libraries.scan(libraryId), 'POST')
  }

  const [activeItem, setActiveItem] = React.useState<Item | null>(null)

  React.useEffect(() => {
    if (librariesItems) {
      setActiveItem(librariesItems.find((item) => item.id === selectedLibraryId) || null)
    }
  }, [selectedLibraryId, librariesItems])

  const librariesItems =
    libraries && libraries.length > 0
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
              navigate(`/library/${library.id}`)
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
                        activeItem && activeItem.id === item.id ? 'bg-transparent' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()

                        setActiveItem(item)
                        navigate(`/library/${item.id}`)
                      }}
                      style={{
                        color: activeItem && activeItem.id === item.id ? 'var(--app-color)' : '',
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
                          color: activeItem && activeItem.id === item.id ? 'var(--app-color)' : '',
                        }}
                      >
                        {item.name}
                      </span>
                    </a>
                  </SidebarMenuButton>
                  {isAdmin && (
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
                            const library = libraries.find((library) => library.id === item.id)

                            if (library) {
                              openDialog('library', { id: library.id })
                            }
                          }}
                        >
                          <Pencil className="text-muted-foreground" />
                          <span>{t('editButton')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => searchFiles(item.id)}>
                          <SearchIcon className="text-muted-foreground" />
                          <span>{t('searchFiles')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDialog('removeLibrary', { id: item.id })}
                        >
                          <Trash2 className="text-muted-foreground" />
                          <span>{t('removeLibrary')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </>
      )}

      {isAdmin && apiKeyStatus && (
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
                      openDialog('library', {})
                    }
                  }}
                >
                  <a
                    href={''}
                    className="flex items-center gap-2"
                    style={{
                      color: analyzing ? '#999999' : '',
                      cursor: analyzing ? 'not-allowed' : '',
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    <Plus />
                    <span style={{ color: analyzing ? '#999999' : '' }}>
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
