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
import { useAuth } from '@/context/auth.context'
import { cn } from '@/utils/tailwind'
import { Bell, ChevronRight, LogOut, Settings, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import FlexBox from '../ui/FlexBox'
import { Invitation } from '@/data/interfaces/Users'
import { getInvitations } from '@/lib/auth'
export function NavUser() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const updateInterval = 5000

  if (!user) return null

  const handleGoToSettings = () => {
    navigate('/settings')
  }

  const handleGoToProfile = () => {
    navigate('/profile')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
  }

  const updateInvitations = async () => {
    setInvitations(await getInvitations())
  }

  useEffect(() => {
    updateInvitations()
    const interval = setInterval(updateInvitations, updateInterval)
    return () => clearInterval(interval)
  }, [])

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
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
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
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleGoToProfile}>
                <UserRound />
                Profile
                {invitations && invitations.length > 0 && (
                  <FlexBox className="items-center justify-center rounded-full bg-red-700">
                    <span className="flex w-5 items-center justify-center">
                      {invitations.length}
                    </span>
                  </FlexBox>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGoToSettings}>
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
