import { Outlet } from 'react-router';
import BaseLayout from '@/layouts/BaseLayout';

function TopBarLayout() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}

export default TopBarLayout;
