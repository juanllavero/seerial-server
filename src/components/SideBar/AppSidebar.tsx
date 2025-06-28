import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import NavLibraries from './NavLibraries'
import { NavUser } from './NavUser'
import { ServerSwitcher } from './ServerSwitcher'
import NavHomeButton from './NavHomeButton'
import NavSettings from './settings/NavSettings'
import { useLocation } from 'react-router-dom'
import { memo, useMemo } from 'react'
import useMusicStore from '@/context/music.context'

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const inSettings = useMemo(
    () => location.pathname.includes('/settings'),
    [location.pathname],
  )
  const { currentSong } = useMusicStore()

  console.log(`AppSidebar [${new Date().toISOString()}]: `, {
    pathname: location.pathname,
    inSettings,
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavHomeButton />
        {inSettings ? <NavSettings /> : <NavLibraries />}
      </SidebarContent>
      <SidebarFooter
        className={`transition-all duration-500 ease-in-out ${currentSong ? 'pb-30' : 'pb-0'}`}
      >
        <ServerSwitcher />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

export default memo(AppSidebar)
