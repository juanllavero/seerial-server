import { t } from 'i18next';
import { House } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../../../shared/ui/sidebar';

const NavHomeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const inHome = pathname.includes('/home');

  const home = {
    id: '0',
    name: t('home'),
    logo: House,
    action: () => {
      navigate('/home');
    },
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={home.name}>
            {/** biome-ignore lint/a11y/useValidAnchor: <Needs to be an <a> element> */}
            <a
              href={''}
              className={`flex items-center gap-2 ${inHome ? 'bg-accent' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate('/home');
              }}
              style={{
                color: inHome ? 'var(--app-color)' : '',
              }}
            >
              <home.logo />
              <span
                className="font-semibold"
                style={{
                  color: inHome ? 'var(--app-color)' : '',
                }}
              >
                {home.name}
              </span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default NavHomeButton;
