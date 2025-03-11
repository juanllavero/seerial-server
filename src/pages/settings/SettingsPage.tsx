import FlexBox from '@/components/ui/FlexBox'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ClientGeneral from './components/ClientGeneral'
import ClientQuality from './components/ClientQuality'
import ClientPlayer from './components/ClientPlayer'
import ServerGeneral from './components/ServerGeneral'
import ServerLanguages from './components/ServerLanguages'
import ServerTranscode from './components/ServerTranscode'
import ServerLibraries from './components/ServerLibraries'
import { Button } from '@/components/ui/button'

enum SettingsSection {
  ClientGeneral = 1,
  ClientQuality,
  ClientPlayer,
  ServerGeneral,
  ServerTranscode,
  ServerLanguages,
  ServerLibraries,
}

function SettingsPage() {
  const { t } = useTranslation()
  const [currentSection, setCurrentSection] = React.useState<SettingsSection>(
    SettingsSection.ClientGeneral,
  )

  return (
    <FlexBox gap={4} padding="10rem 3rem">
      <FlexBox direction="column" gap={0.5} className="min-w-50">
        {/* Client Settings */}
        <span className="text-lg font-semibold">{t('client')}</span>
        <Button
          variant={'ghost'}
          style={{
            color:
              currentSection === SettingsSection.ClientGeneral
                ? 'var(--app-color)'
                : 'white',
          }}
          onClick={() => setCurrentSection(SettingsSection.ClientGeneral)}
        >
          {t('generalButton')}
        </Button>
        <Button
          variant={'ghost'}
          style={{
            color:
              currentSection === SettingsSection.ClientQuality
                ? 'var(--app-color)'
                : 'white',
          }}
          onClick={() => setCurrentSection(SettingsSection.ClientQuality)}
        >
          {t('quality')}
        </Button>
        <Button
          variant={'ghost'}
          style={{
            color:
              currentSection === SettingsSection.ClientPlayer
                ? 'var(--app-color)'
                : 'white',
          }}
          onClick={() => setCurrentSection(SettingsSection.ClientPlayer)}
        >
          {t('player')}
        </Button>

        {/* Server Settings */}
        <span className="text-lg font-semibold">{t('server')}</span>
        <Button
          variant={'ghost'}
          style={{
            color:
              currentSection === SettingsSection.ServerGeneral
                ? 'var(--app-color)'
                : 'white',
          }}
          onClick={() => setCurrentSection(SettingsSection.ServerGeneral)}
        >
          {t('generalButton')}
        </Button>
        <Button
          variant={'ghost'}
          style={{
            color:
              currentSection === SettingsSection.ServerLanguages
                ? 'var(--app-color)'
                : 'white',
          }}
          onClick={() => setCurrentSection(SettingsSection.ServerLanguages)}
        >
          {t('languages')}
        </Button>
        <Button
          variant={'ghost'}
          style={{
            color:
              currentSection === SettingsSection.ServerTranscode
                ? 'var(--app-color)'
                : 'white',
          }}
          onClick={() => setCurrentSection(SettingsSection.ServerTranscode)}
        >
          {t('transcode')}
        </Button>
        <Button
          variant={'ghost'}
          style={{
            color:
              currentSection === SettingsSection.ServerLibraries
                ? 'var(--app-color)'
                : 'white',
          }}
          onClick={() => setCurrentSection(SettingsSection.ServerLibraries)}
        >
          {t('libraries')}
        </Button>
      </FlexBox>
      <FlexBox scroll="vertical">
        {currentSection === SettingsSection.ClientGeneral ? (
          <ClientGeneral />
        ) : currentSection === SettingsSection.ClientQuality ? (
          <ClientQuality />
        ) : currentSection === SettingsSection.ClientPlayer ? (
          <ClientPlayer />
        ) : currentSection === SettingsSection.ServerGeneral ? (
          <ServerGeneral />
        ) : currentSection === SettingsSection.ServerLanguages ? (
          <ServerLanguages />
        ) : currentSection === SettingsSection.ServerTranscode ? (
          <ServerTranscode />
        ) : (
          <ServerLibraries />
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default SettingsPage
