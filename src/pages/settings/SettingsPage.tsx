import FlexBox from '@/components/ui/FlexBox'
import React, { useEffect, useState } from 'react'
import ClientGeneral from './components/ClientGeneral'
import ClientPlayer from './components/ClientPlayer'
import ClientQuality from './components/ClientQuality'
import ServerGeneral from './components/ServerGeneral'
import ServerLanguages from './components/ServerLanguages'
import ServerLibraries from './components/ServerLibraries'
import ServerTranscode from './components/ServerTranscode'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import Loading from '@/components/Loading'
import { SettingsSection } from '@/data/interfaces/Utils'
import LeftPanel from './components/leftPanel/LeftPanel'

function SettingsPage() {
  const { serverIP } = useServerStore()
  const { getAllClientSettings, getAllServerSettings } = useSettingsStore()
  const [currentSection, setCurrentSection] = useState<SettingsSection>(
    SettingsSection.ClientGeneral,
  )

  const [clientSettings, setClientSettings] = useState({})
  const [serverSettings, setServerSettings] = useState({})
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    loadClientSettings()
    loadServerSettings()
  }, [serverIP])

  const loadClientSettings = async () => {
    setLoadingSettings(true)
    const settings = await getAllClientSettings(serverIP)
    setClientSettings(settings)
    setLoadingSettings(false)
  }

  const loadServerSettings = async () => {
    setLoadingSettings(true)
    const settings = await getAllServerSettings(serverIP)
    setServerSettings(settings)
    setLoadingSettings(false)
  }

  return (
    <FlexBox gap={4} padding="10rem 3rem">
      {/* Left Panel */}
      <LeftPanel
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />

      {/* Right Panel */}
      {loadingSettings ? (
        <Loading />
      ) : (
        <FlexBox scroll="vertical">
          {currentSection === SettingsSection.ClientGeneral ? (
            <ClientGeneral clientSettings={clientSettings} />
          ) : currentSection === SettingsSection.ClientQuality ? (
            <ClientQuality clientSettings={clientSettings} />
          ) : currentSection === SettingsSection.ClientPlayer ? (
            <ClientPlayer clientSettings={clientSettings} />
          ) : currentSection === SettingsSection.ServerGeneral ? (
            <ServerGeneral serverSettings={serverSettings} />
          ) : currentSection === SettingsSection.ServerLanguages ? (
            <ServerLanguages serverSettings={serverSettings} />
          ) : currentSection === SettingsSection.ServerTranscode ? (
            <ServerTranscode serverSettings={serverSettings} />
          ) : (
            <ServerLibraries serverSettings={serverSettings} />
          )}
        </FlexBox>
      )}
    </FlexBox>
  )
}

export default SettingsPage
