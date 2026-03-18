import React from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import LabeledInputWrapper from '@/shared/forms/labeled-input-wrapper';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import LangToggle from '@/shared/ui/lang-toggle';
import SelectableWrapper from '@/shared/ui/selectable-wrapper';
import { useSettingsStore } from '../stores/settings-store';
import ContentWrapper from './utils/content-wrapper';

const TimeFormatOptions = [
  {
    key: '12h',
    value: '12h',
  },
  {
    key: '24h',
    value: '24h',
  },
];

function ClientGeneral() {
  const { t } = useTranslation();
  const { setClientSetting, clientSettings, setClientSettings } = useSettingsStore(
    (state) => ({
      setClientSetting: state.setClientSetting,
      clientSettings: state.clientSettings,
      setClientSettings: state.setClientSettings,
    }),
    shallow,
  );
  const [isDirty, setIsDirty] = React.useState(false);
  const [showMessage, setShowMessage] = React.useState(false);

  const [playMusic, setPlayMusic] = React.useState(
    clientSettings['playBackgroundMusic'] as boolean,
  );
  const [musicVolume, setMusicVolume] = React.useState(
    clientSettings['backgroundMusicVolume'] as number,
  );
  const [timeFormat, setTimeFormat] = React.useState(clientSettings['timeFormat'] as string);

  const handlePlayBackgroundMusicChange = (checked: boolean) => {
    setPlayMusic(checked);
    setIsDirty(true);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMusicVolume(Number(e.target.value));
    setIsDirty(true);
  };

  const handleTimeFormatChange = (key: string) => {
    setTimeFormat(key);
    setIsDirty(true);
  };

  const handleSave = () => {
    setClientSetting('playBackgroundMusic', playMusic);
    setClientSetting('backgroundMusicVolume', musicVolume);
    setClientSetting('timeFormat', timeFormat);

    setClientSettings({
      ...clientSettings,
      playBackgroundMusic: playMusic,
      backgroundMusicVolume: musicVolume,
      timeFormat: timeFormat,
    });

    setIsDirty(false);

    setShowMessage(true);

    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  return (
    <ContentWrapper group={t('client')} section={t('generalButton')}>
      <LabeledInputWrapper direction="row" label={t('languageText')}>
        <LangToggle />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        direction="row"
        label={t('playBackgroundMusic')}
        text={t('playBackgroundMusicMessage')}
      >
        <Checkbox checked={playMusic} onCheckedChange={handlePlayBackgroundMusicChange} />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('musicVolume')}>
        <Input min={0} max={100} value={musicVolume} onChange={handleMusicVolumeChange} />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('timeFormat')}>
        <SelectableWrapper
          options={TimeFormatOptions}
          defaultValue={timeFormat}
          onValueChange={handleTimeFormatChange}
        />
      </LabeledInputWrapper>

      <FlexBox gap={1} justify="center" align="center">
        <Button disabled={!isDirty} onClick={handleSave}>
          {t('saveButton')}
        </Button>
        {showMessage && (
          <span className="text-muted-foreground text-sm">✔ {t('changesSaved')}</span>
        )}
      </FlexBox>
    </ContentWrapper>
  );
}

export default ClientGeneral;
