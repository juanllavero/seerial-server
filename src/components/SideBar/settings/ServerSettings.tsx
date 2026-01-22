import { useTranslation } from 'react-i18next'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '../../ui/sidebar'

import { useSettingsStore } from '@/context/settings.context'
import { SettingsSection } from '@/data/interfaces/Utils'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { shallow } from 'zustand/shallow'
import { SidebarMenuButton } from '../../ui/sidebar'

const ServerSettings = () => {
  const { t } = useTranslation()
  const { settingsSection, setSettingsSection } = useSettingsStore(
    (state) => ({
      settingsSection: state.settingsSection,
      setSettingsSection: state.setSettingsSection,
    }),
    shallow,
  )
  const isAdmin = useIsAdmin()

  if (!isAdmin) return null
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('server')}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t('generalButton')}
            onClick={() => setSettingsSection(SettingsSection.ServerGeneral)}
            className={`${
              settingsSection === SettingsSection.ServerGeneral
                ? 'bg-accent'
                : ''
            }`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSection.ServerGeneral
                    ? 'var(--app-color)'
                    : 'white',
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
            onClick={() => setSettingsSection(SettingsSection.ServerLanguages)}
            className={`${
              settingsSection === SettingsSection.ServerLanguages
                ? 'bg-accent'
                : ''
            }`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSection.ServerLanguages
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
            onClick={() => setSettingsSection(SettingsSection.ServerTranscode)}
            className={`${
              settingsSection === SettingsSection.ServerTranscode
                ? 'bg-accent'
                : ''
            }`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSection.ServerTranscode
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
            onClick={() => setSettingsSection(SettingsSection.ServerLibraries)}
            className={`${
              settingsSection === SettingsSection.ServerLibraries
                ? 'bg-accent'
                : ''
            }`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSection.ServerLibraries
                    ? 'var(--app-color)'
                    : 'white',
              }}
            >
              {t('libraries')}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

export default ServerSettings
