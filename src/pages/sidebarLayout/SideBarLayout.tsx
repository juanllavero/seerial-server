import AppSidebar from '@/components/SideBar/AppSidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Outlet, useLocation } from 'react-router-dom'
import CardWidthSlider from './components/CardWidthSlider'
import { useMemo } from 'react'

const SideBarLayout = () => {
  const location = useLocation()
  const inSettings = useMemo(
    () => location.pathname.includes('/settings'),
    [location.pathname],
  )

  console.log(`SideBarLayout [${new Date().toISOString()}]: `, {
    pathname: location.pathname,
    inSettings,
  })

  return (
    <div className="relative">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-end gap-2 p-2 pb-3 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            {!inSettings && (
              <>
                <SidebarTrigger className="mr-3 ml-3" />
                <CardWidthSlider />
              </>
            )}
            {/* <DisplayCollectionsSelector /> */}
          </header>
          <div className="h-screen">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default SideBarLayout
