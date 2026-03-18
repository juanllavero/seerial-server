import { SettingsSections } from '@seerial/domain';
import { useIsAdmin } from '@seerial/hooks';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { useSettingsStore } from '@/features/settings';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../../../../shared/ui/sidebar';

const ServerSettings = () => {
  const { t } = useTranslation();
  const { settingsSection, setSettingsSection } = useSettingsStore(
    (state) => ({
      settingsSection: state.settingsSection,
      setSettingsSection: state.setSettingsSection,
    }),
    shallow,
  );
  const isAdmin = useIsAdmin();

  if (!isAdmin) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('server')}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t('generalButton')}
            onClick={() => setSettingsSection(SettingsSections.ServerGeneral)}
            className={`${settingsSection === SettingsSections.ServerGeneral ? 'bg-accent' : ''}`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSections.ServerGeneral ? 'var(--app-color)' : 'white',
              }}
            >
              {t('generalButton')}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t('languages')}
            onClick={() => setSettingsSection(SettingsSections.ServerLanguages)}
            className={`${settingsSection === SettingsSections.ServerLanguages ? 'bg-accent' : ''}`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSections.ServerLanguages
                    ? 'var(--app-color)'
                    : 'white',
              }}
            >
              {t('languages')}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t('transcode')}
            onClick={() => setSettingsSection(SettingsSections.ServerTranscode)}
            className={`${settingsSection === SettingsSections.ServerTranscode ? 'bg-accent' : ''}`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSections.ServerTranscode
                    ? 'var(--app-color)'
                    : 'white',
              }}
            >
              {t('transcode')}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t('libraries')}
            onClick={() => setSettingsSection(SettingsSections.ServerLibrary)}
            className={`${settingsSection === SettingsSections.ServerLibrary ? 'bg-accent' : ''}`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSections.ServerLibrary ? 'var(--app-color)' : 'white',
              }}
            >
              {t('libraries')}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default ServerSettings;
