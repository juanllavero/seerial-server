import { useTranslation } from 'react-i18next'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '../../ui/sidebar'

import { SidebarMenuButton } from '../../ui/sidebar'
import { useSettingsStore } from '@/context/settings.context'
import { SettingsSection } from '@/data/interfaces/Utils'

const ClientSettings = () => {
  const { t } = useTranslation()
  const { settingsSection, setSettingsSection } = useSettingsStore((state) => ({
    settingsSection: state.settingsSection,
    setSettingsSection: state.setSettingsSection,
  }))
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('client')}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t('generalButton')}
            onClick={() => setSettingsSection(SettingsSection.ClientGeneral)}
            className={`${
              settingsSection === SettingsSection.ClientGeneral
                ? 'bg-accent'
                : ''
            }`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSection.ClientGeneral
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
            tooltip={t('quality')}
            onClick={() => setSettingsSection(SettingsSection.ClientQuality)}
            className={`${
              settingsSection === SettingsSection.ClientQuality
                ? 'bg-accent'
                : ''
            }`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSection.ClientQuality
                    ? 'var(--app-color)'
                    : 'white',
              }}
            >
              {t('quality')}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t('player')}
            onClick={() => setSettingsSection(SettingsSection.ClientPlayer)}
            className={`${
              settingsSection === SettingsSection.ClientPlayer
                ? 'bg-accent'
                : ''
            }`}
          >
            <span
              style={{
                color:
                  settingsSection === SettingsSection.ClientPlayer
                    ? 'var(--app-color)'
                    : 'white',
              }}
            >
              {t('player')}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

export default ClientSettings
