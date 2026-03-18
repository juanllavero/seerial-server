import { SettingsSection } from '@seerial/domain';
import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import {
  ClientGeneral,
  ClientPlayer,
  ClientQuality,
  ServerGeneral,
  ServerLanguages,
  ServerLibraries,
  ServerTranscode,
  useSettingsStore,
} from '@/features/settings';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import FlexBox from '@/shared/ui/flex-box';

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
  }, [getAllClientSettings, getAllServerSettings]);

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
