import { ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/auth.context'
import { useServerStore } from '@/context/server.context'
import { Server } from '@/data/interfaces/Users'
import { useEffect, useState } from 'react'
import { ServerIcon } from '../ui/IconLibrary'
import { cn } from '@/utils/tailwind'

export function ServerSwitcher() {
  const { user } = useAuth()
  const { selectServer, selectedServer } = useServerStore()

  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)

  const servers = user && user.servers ? user.servers : []

  const { isMobile } = useSidebar()
  const [activeServer, setActiveServer] = useState<Server | undefined>(
    servers.length > 0 ? servers[0] : undefined,
  )

  useEffect(() => {
    if (selectedServer) {
      setActiveServer(selectedServer)
    }
  }, [selectedServer])

  if (servers.length > 0 && !activeServer) {
    selectServer(servers[0])
    setActiveServer(servers[0])
  }

  if (!activeServer) {
    return null
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size={'lg'}
              className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <ServerIcon />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeServer.name}
                </span>
                <span className="truncate text-xs">{activeServer.ip}</span>
              </div>
              <ChevronRight
                className={cn(
                  'ml-auto size-4 opacity-0 transition-transform duration-150 ease-in-out',
                  open && 'scale-x-[-1]',
                  (hover || open) && 'opacity-100',
                )}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] max-w-56 min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Servers
            </DropdownMenuLabel>
            {servers.map((server, index) => (
              <DropdownMenuItem
                key={server.ip + index}
                onClick={() => {
                  setActiveServer(server)
                  selectServer(server)
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <ServerIcon />
                </div>
                {server.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
