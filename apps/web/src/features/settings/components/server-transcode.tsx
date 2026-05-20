import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import LabeledInputWrapper from '@/shared/forms/labeled-input-wrapper';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import SelectableWrapper from '@/shared/ui/selectable-wrapper';
import { useSettingsStore } from '../stores/settings-store';
import ContentWrapper from './utils/content-wrapper';

function ServerTranscode() {
  const { t } = useTranslation();
  const [isDirty, setIsDirty] = React.useState(false);
  const [showMessage, setShowMessage] = React.useState(false);
  const { setServerSetting, serverSettings, setServerSettings } = useSettingsStore(
    (state) => ({
      setServerSetting: state.setServerSetting,
      serverSettings: state.serverSettings,
      setServerSettings: state.setServerSettings,
    }),
    shallow,
  );

  const transcoderOptions = [
    {
      key: 'ultrafast',
      value: 'ultrafast',
    },
    {
      key: 'superfast',
      value: 'superfast',
    },
    {
      key: 'veryfast',
      value: 'veryfast',
    },
    {
      key: 'faster',
      value: 'faster',
    },
    {
      key: 'fast',
      value: 'fast',
    },
    {
      key: 'medium',
      value: 'medium',
    },
    {
      key: 'slow',
      value: 'slow',
    },
    {
      key: 'slower',
      value: 'slower',
    },
    {
      key: 'veryslow',
      value: 'veryslow',
    },
    {
      key: 'placebo',
      value: 'placebo',
    },
  ];

  const [tempFolder, setTempFolder] = useState<string>(
    (serverSettings['tempTranscodeFolder'] as string) ?? '',
  );
  const [transcoderPreset, setTranscoderPreset] = useState<string>(
    (serverSettings['transcodePreset'] as string) ?? transcoderOptions[0].value,
  );
  const [defaultBuffer, setDefaultBuffer] = useState<number>(
    (serverSettings['transcodeBuffer'] as number) ?? 60,
  );
  const [maxTranscoding, setMaxTranscoding] = useState<number>(
    (serverSettings['maxTranscodeProcesses'] as number) ?? 4,
  );

  const handleTranscoderPresetChange = (key: string) => {
    setTranscoderPreset(key);
    setIsDirty(true);
  };

  const handleSelectFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempFolder(e.target.value);
    setIsDirty(true);
  };

  const handleDefaultBufferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultBuffer(parseInt(e.target.value));
    setIsDirty(true);
  };

  const handleMaxTranscodingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxTranscoding(parseInt(e.target.value));
    setIsDirty(true);
  };

  const handleSave = () => {
    setServerSetting('tempTranscodeFolder', tempFolder);
    setServerSetting('transcodePreset', transcoderPreset);
    setServerSetting('transcodeBuffer', defaultBuffer);
    setServerSetting('maxTranscodeProcesses', maxTranscoding);

    setServerSettings({
      ...serverSettings,
      tempTranscodeFolder: tempFolder,
      transcodePreset: transcoderPreset,
      transcodeBuffer: defaultBuffer,
      maxTranscodeProcesses: maxTranscoding,
    });

    setIsDirty(false);

    setShowMessage(true);

    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  return (
    <ContentWrapper group={t('server')} section={t('transcode')}>
      <LabeledInputWrapper label={t('tempFolder')} text={t('tempFolderMessage')}>
        <Input type="text" value={tempFolder} onChange={handleSelectFolder} />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('defaultBuffer')} text={t('defaultBufferMessage')}>
        <Input
          type="number"
          min={0}
          max={300}
          defaultValue={60}
          value={defaultBuffer}
          onChange={handleDefaultBufferChange}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('transcoderPreset')} text={t('transcoderPresetMessage')}>
        <SelectableWrapper
          defaultValue={transcoderPreset}
          onValueChange={handleTranscoderPresetChange}
          options={transcoderOptions}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('maxTranscoding')}>
        <Input
          type="number"
          min={0}
          defaultValue={4}
          value={maxTranscoding}
          onChange={handleMaxTranscodingChange}
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

export default ServerTranscode;
