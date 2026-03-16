import { memo, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { useMusicStore } from '@seerial/stores'
import NavHomeButton from './NavHomeButton'
import NavLibraries from './NavLibraries'
import { NavUser } from './NavUser'
import NavSettings from './settings/NavSettings'

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const inSettings = useMemo(() => location.pathname.includes('/settings'), [location.pathname])
  const hasSong = useMusicStore((state) => Boolean(state.currentSong))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <NavHomeButton />
        {inSettings ? <NavSettings /> : <NavLibraries />}
      </SidebarContent>
      <SidebarFooter
        className={`transition-all duration-500 ease-in-out ${hasSong ? 'pb-30' : 'pb-2'}`}
      >
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

export default memo(AppSidebar)
