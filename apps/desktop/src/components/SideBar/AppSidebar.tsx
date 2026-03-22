import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '../../components/ui/sidebar';
import NavHomeButton from './NavHomeButton';
import { NavLibraries } from './NavLibraries';
import { NavUser } from './NavUser';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const inSettings = useMemo(() => location.pathname.includes('/settings'), [location.pathname]);

  console.log(`AppSidebar [${new Date().toISOString()}]: `, {
    pathname: location.pathname,
    inSettings,
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser />
      </SidebarHeader>
      <SidebarContent>
        <NavHomeButton />
        <NavLibraries />
      </SidebarContent>
      <SidebarFooter>{/* <ServerSwitcher /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
