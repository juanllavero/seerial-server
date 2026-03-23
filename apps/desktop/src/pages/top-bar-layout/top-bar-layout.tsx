import { Outlet } from 'react-router';
import BaseLayout from '@/features/top-bar-layout/BaseLayout';

const TopBarLayout = () => {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
};

export default TopBarLayout;
