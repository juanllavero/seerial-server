import { useMusicStore } from '@seerial/stores';
import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar, CardWidthSlider } from '@/features/shell';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar';

const SideBarLayout = () => {
  const location = useLocation();
  const { pathname } = location;
  const inSettings = useMemo(() => pathname.includes('/settings'), [pathname]);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const hasSong = useMusicStore((state) => Boolean(state.currentSong));

  return (
    <div className="relative">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-end gap-2 p-2 pb-3 transition-[width,height] ease-linear">
            {!inSettings && (
              <>
                {isMobile || !isTablet ? (
                  <SidebarTrigger className="mr-3 ml-3" />
                ) : (
                  <div className="w-5" />
                )}
                <CardWidthSlider />
              </>
            )}
            {/* <DisplayCollectionsSelector /> */}
          </header>
          <div
            className={`h-screen transition-all duration-500 ease-in-out ${hasSong ? 'pb-30' : 'pb-0'}`}
          >
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default SideBarLayout;
