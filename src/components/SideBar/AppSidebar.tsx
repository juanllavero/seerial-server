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

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const inSettings = useMemo(
    () => location.pathname.includes('/settings'),
    [location.pathname],
  )

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
      <SidebarFooter>
        <ServerSwitcher />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

export default memo(AppSidebar)
