import { useServerStore } from '@seerial/stores';
import type { JSX } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import LogoIntro from '@/features/home/components/logo-intro';

const PUBLIC_PATHS = ['/login', '/link'];
const ALLOWED_PATHS_WHEN_SERVER_DOWN = ['/home', '/settings'];

function Root() {
  const location = useLocation();
  const { user, server, serverOnline } = useServerStore(
    (state) => ({
      user: state.currentUser,
      server: state.selectedServer,
      serverOnline: state.serverOnline,
    }),
    shallow,
  );

  const isPublic = PUBLIC_PATHS.includes(location.pathname);
  const isAllowedWhenServerDown = ALLOWED_PATHS_WHEN_SERVER_DOWN.some((path) =>
    location.pathname.startsWith(path),
  );

  let routeContent: JSX.Element;

  if (!user || !server) {
    routeContent = isPublic ? <Outlet /> : <Navigate to="/login" replace />;
  } else if (serverOnline === false && !isAllowedWhenServerDown) {
    routeContent = <Navigate to="/home" replace />;
  } else {
    routeContent = <Outlet />;
  }

  return (
    <>
      <LogoIntro />
      {routeContent}
    </>
  );
}

export default Root;
