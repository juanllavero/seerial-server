import { AppSidebar } from '@/components/SideBar/AppSidebar'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Outlet, useLocation } from '@tanstack/react-router'
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
          <header className="flex h-16 shrink-0 items-center gap-2 p-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            {!inSettings && (
              <>
                <SidebarTrigger className="ml-3" />
                <Separator orientation="vertical" />
                <CardWidthSlider />
              </>
            )}
            {/* <DisplayCollectionsSelector /> */}
          </header>
          {/* <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Building Your Application
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb> */}
          <div className="h-screen">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default SideBarLayout
