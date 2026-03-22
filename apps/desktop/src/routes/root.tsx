import { useServerStore } from '@seerial/stores';
import { Outlet, useNavigate } from 'react-router-dom';
import { shallow } from 'zustand/shallow';

function Root() {
  const navigate = useNavigate();
  const { server, user } = useServerStore(
    (state) => ({
      server: state.selectedServer,
      user: state.currentUser,
    }),
    shallow,
  );

  if (!server && window.location.pathname !== '/login') {
    navigate('/login');
    return null;
  }

  if (!user && window.location.pathname !== '/users' && window.location.pathname !== '/login') {
    navigate('/users');
    return null;
  }

  return <Outlet />;
}

export default Root;
