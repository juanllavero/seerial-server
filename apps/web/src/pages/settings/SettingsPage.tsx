import { SettingsSection } from '@seerial/domain';
import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useIsMobile } from '@/components/hooks/use-mobile';
import FlexBox from '@/components/ui/FlexBox';
import { useSettingsStore } from '@/context/settings.context';
import ClientGeneral from './components/ClientGeneral';
import ClientPlayer from './components/ClientPlayer';
import ClientQuality from './components/ClientQuality';
import ServerGeneral from './components/ServerGeneral';
import ServerLanguages from './components/ServerLanguages';
import ServerLibraries from './components/ServerLibraries';
import ServerTranscode from './components/ServerTranscode';

function SettingsPage() {
  const { getAllClientSettings, getAllServerSettings, clientSettings, serverSettings } =
    useSettingsStore(
      (state) => ({
        getAllClientSettings: state.getAllClientSettings,
        getAllServerSettings: state.getAllServerSettings,
        clientSettings: state.clientSettings,
        serverSettings: state.serverSettings,
      }),
      shallow,
    );
  const settingsSection = useSettingsStore((state) => state.settingsSection);
  const isMobile = useIsMobile();

  useEffect(() => {
    getAllServerSettings();
    getAllClientSettings();
  }, []);

  const isLoaded = Object.keys(serverSettings).length > 0 && Object.keys(clientSettings).length > 0;

  return (
    <FlexBox gap={isMobile ? 0.5 : 4} padding={isMobile ? '1rem' : '2rem'}>
      {isLoaded ? (
        <FlexBox scroll="vertical">
          {settingsSection === SettingsSection.ClientGeneral ? (
            <ClientGeneral />
          ) : settingsSection === SettingsSection.ClientQuality ? (
            <ClientQuality />
          ) : settingsSection === SettingsSection.ClientPlayer ? (
            <ClientPlayer />
          ) : settingsSection === SettingsSection.ServerGeneral ? (
            <ServerGeneral isLoaded={isLoaded} />
          ) : settingsSection === SettingsSection.ServerLanguages ? (
            <ServerLanguages />
          ) : settingsSection === SettingsSection.ServerTranscode ? (
            <ServerTranscode />
          ) : (
            <ServerLibraries />
          )}
        </FlexBox>
      ) : (
        <ServerGeneral isLoaded={isLoaded} />
      )}
    </FlexBox>
  );
}

export default SettingsPage;
