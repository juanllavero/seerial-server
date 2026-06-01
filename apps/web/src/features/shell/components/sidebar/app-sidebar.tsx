import { useMusicStore } from '@seerial/stores';
import { useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/shared/ui/sidebar';
import NavHomeButton from './nav-home-button';
import NavLibraries from './nav-libraries';
import { NavUser } from './nav-user';
import NavSettings from './settings/nav-settings';

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { pathname } = location;
  const inSettings = pathname.includes('/settings');
  const hasSong = useMusicStore((state) => Boolean(state.currentSong));

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
  );
}

export default AppSidebar;
