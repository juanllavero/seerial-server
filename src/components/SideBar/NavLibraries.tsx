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
import { Library } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useNavigate } from '@tanstack/react-router'
import { t } from 'i18next'
import {
  Film,
  Folder,
  Forward,
  House,
  MoreVertical,
  Music,
  Plus,
  Trash2,
  TvMinimal,
} from 'lucide-react'
import React from 'react'
import useSWR from 'swr'

interface Item {
  id: string
  name: string
  logo: React.ElementType
  action: () => void
}

export function NavLibraries() {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  const { selectedServer, serverStatus, apiKeyStatus } = useServerStore()
  const { openLibraryDialog } = useDialogStore()
  const { selectedLibraryId, selectLibrary } = useDataStore()

  const { data: libraries, isLoading } = useSWR<Library[]>(
    selectedServer ? `https://${selectedServer.ip}/libraries/` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  const home = {
    id: '0',
    name: t('home'),
    logo: House,
    action: () => {
      navigate({ to: '/' })
    },
  }

  const [activeItem, setActiveItem] = React.useState<Item>(home)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (!selectedLibraryId) {
      setActiveItem(home)
    } else if (librariesItems) {
      setActiveItem(
        librariesItems.find((item) => item.id === selectedLibraryId) || home,
      )
    }
  }, [selectedLibraryId])

  const librariesItems = libraries
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

  return (
    <>
      {/* Home */}
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={home.name}>
              <a
                href={''}
                className="flex items-center gap-2"
                onClick={(e) => e.preventDefault()}
              >
                <home.logo />
                <span>{home.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

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
                      className="flex items-center gap-2"
                      onClick={(e) => e.preventDefault()}
                    >
                      <item.logo />
                      <span>{item.name}</span>
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
                      <DropdownMenuItem>
                        <Folder className="text-muted-foreground" />
                        <span>View Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Forward className="text-muted-foreground" />
                        <span>Share Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Trash2 className="text-muted-foreground" />
                        <span>Delete Project</span>
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
