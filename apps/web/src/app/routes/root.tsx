import { useServerStore } from '@seerial/stores';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import BaseLayout from '@/shared/layout/base-layout';

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

  // Redirect to login if not authenticated
  if (!user || !server) {
    if (!isPublic) return <Navigate to="/login" replace />;
    return <Outlet />;
  }

  // Redirect to home if server is down and not on allowed paths
  if (serverOnline === false && !isAllowedWhenServerDown) {
    return <Navigate to="/home" replace />;
  }

  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}

export default Root;
