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

interface Item {
  id: string
  name: string
  type: string
  logo: React.ElementType
  action: () => void
}

const NavLibraries = () => {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  const { selectedServer, serverStatus, apiKeyStatus } = useServerStore()
  const { openLibraryDialog, openRemoveLibraryDialog } = useDialogStore()
  const { selectedLibraryId, selectLibrary } = useDataStore()

  const { data: libraries, isLoading } = useSWR<Library[]>(
    selectedServer ? `https://${selectedServer.ip}/libraries/` : null,
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
      {isLoading || !libraries ? null : (
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
                          ? 'bg-accent'
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
                      <item.logo />
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
                  onClick={() => openLibraryDialog()}
                >
                  <a
                    href={''}
                    className="flex items-center gap-2"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Plus />
                    <span>{t('libraryWindowTitle')}</span>
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
