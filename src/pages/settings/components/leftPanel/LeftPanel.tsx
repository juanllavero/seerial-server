import FlexBox from '@/components/ui/FlexBox'
import { useTranslation } from 'react-i18next'
import React from 'react'
import { SettingsSection } from '@/data/interfaces/Utils'
import LeftPanelButton from './LeftPanelButton'
import LeftPanelGroup from './LeftPanelGroup'

function LeftPanel({
  currentSection,
  setCurrentSection,
}: {
  currentSection: SettingsSection
  setCurrentSection: (section: SettingsSection) => void
}) {
  const { t } = useTranslation()

  return (
    <FlexBox direction="column" gap={1} className="min-w-50">
      {/* Client Settings */}
      <LeftPanelGroup title={t('client')}>
        <LeftPanelButton
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          section={SettingsSection.ClientGeneral}
          label={t('generalButton')}
        />
        <LeftPanelButton
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          section={SettingsSection.ClientQuality}
          label={t('quality')}
        />
        <LeftPanelButton
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          section={SettingsSection.ClientPlayer}
          label={t('player')}
        />
      </LeftPanelGroup>

      {/* Server Settings */}
      <LeftPanelGroup title={t('server')}>
        <LeftPanelButton
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          section={SettingsSection.ServerGeneral}
          label={t('generalButton')}
        />
        <LeftPanelButton
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          section={SettingsSection.ServerLanguages}
          label={t('languages')}
        />
        <LeftPanelButton
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          section={SettingsSection.ServerTranscode}
          label={t('transcode')}
        />
        <LeftPanelButton
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          section={SettingsSection.ServerLibraries}
          label={t('libraries')}
        />
      </LeftPanelGroup>
    </FlexBox>
  )
}

export default LeftPanel
