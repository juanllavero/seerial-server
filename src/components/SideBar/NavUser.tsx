import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useServerStore } from '@/context/server.context'
import { cn } from '@/utils/tailwind'
import { ChevronRight, LogOut, Settings, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
export function NavUser() {
  const navigate = useNavigate()
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  )
  const { isMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)

  const handleGoToSettings = () => {
    navigate('/settings')
  }

  const handleChangeProfile = () => {
    navigate('/users')
  }

  const handleLogout = () => {
    navigate('/login')
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
  }

  if (!user) return null

  const image = user.avatar ?? ''

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={image} alt={user.username} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.username}</span>
              </div>
              <div className="h-6 w-6">
                <ChevronRight
                  className={cn(
                    'ml-auto opacity-0 transition-all duration-150 ease-in-out',
                    open && 'scale-x-[-1]',
                    (hover || open) && 'opacity-100',
                  )}
                />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={image} alt={user.username} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.username}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleChangeProfile}>
                <UserRound />
                Change Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGoToSettings}>
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Change server
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
