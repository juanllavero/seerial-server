import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import { SettingsSection } from '@/data/interfaces/Utils'
import { useEffect, useState } from 'react'
import ClientGeneral from './components/ClientGeneral'
import ClientPlayer from './components/ClientPlayer'
import ClientQuality from './components/ClientQuality'
import LeftPanel from './components/leftPanel/LeftPanel'
import ServerGeneral from './components/ServerGeneral'
import ServerLanguages from './components/ServerLanguages'
import ServerLibraries from './components/ServerLibraries'
import ServerTranscode from './components/ServerTranscode'

function SettingsPage() {
  const { selectedServer } = useServerStore()
  const {
    getAllClientSettings,
    getAllServerSettings,
    clientSettings,
    serverSettings,
  } = useSettingsStore()
  const [currentSection, setCurrentSection] = useState<SettingsSection>(
    SettingsSection.ServerGeneral,
  )
  const isMobile = useIsMobile()

  useEffect(() => {
    if (selectedServer) {
      const serverIP = selectedServer.ip
      getAllServerSettings(serverIP)
      getAllClientSettings(serverIP)
    }
  }, [selectedServer])

  const isLoaded =
    Object.keys(serverSettings).length > 0 &&
    Object.keys(clientSettings).length > 0

  return (
    <FlexBox
      gap={isMobile ? 0.5 : 4}
      padding={isMobile ? '8rem 1rem' : '10rem 3rem'}
    >
      {/* Left Panel */}
      <LeftPanel
        isLoaded={isLoaded}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />

      {/* Right Panel */}
      {!isLoaded ? (
        <ServerGeneral isLoaded={isLoaded} />
      ) : (
        <FlexBox scroll="vertical">
          {currentSection === SettingsSection.ClientGeneral ? (
            <ClientGeneral />
          ) : currentSection === SettingsSection.ClientQuality ? (
            <ClientQuality />
          ) : currentSection === SettingsSection.ClientPlayer ? (
            <ClientPlayer />
          ) : currentSection === SettingsSection.ServerGeneral ? (
            <ServerGeneral isLoaded={isLoaded} />
          ) : currentSection === SettingsSection.ServerLanguages ? (
            <ServerLanguages />
          ) : currentSection === SettingsSection.ServerTranscode ? (
            <ServerTranscode />
          ) : (
            <ServerLibraries />
          )}
        </FlexBox>
      )}
    </FlexBox>
  )
}

export default SettingsPage
