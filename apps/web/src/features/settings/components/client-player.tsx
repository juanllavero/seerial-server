import React from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import LabeledInputWrapper from '@/shared/forms/labeled-input-wrapper';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import SelectableWrapper from '@/shared/ui/selectable-wrapper';
import { useSettingsStore } from '../stores/settings-store';
import ContentWrapper from './utils/content-wrapper';

function ClientPlayer() {
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

  const subtitleColorOptions = [
    {
      key: 'white',
      value: t('white'),
    },
    {
      key: 'black',
      value: t('black'),
    },
    {
      key: 'gray',
      value: t('gray'),
    },
    {
      key: 'brown',
      value: t('brown'),
    },
  ];

  const subtitleSizeOptions = [
    {
      key: 'tiny',
      value: t('tiny'),
    },
    {
      key: 'small',
      value: t('small'),
    },
    {
      key: 'normal',
      value: t('normal'),
    },
    {
      key: 'big',
      value: t('big'),
    },
    {
      key: 'large',
      value: t('large'),
    },
  ];

  const subtitlePositionOptions = [
    {
      key: 'up',
      value: t('up'),
    },
    {
      key: 'center',
      value: t('center'),
    },
    {
      key: 'down',
      value: t('down'),
    },
  ];

  const subtitleBurnOptions = [
    {
      key: 'auto',
      value: t('auto'),
    },
    {
      key: 'onlyImageSubtitles',
      value: t('onlyImageSubtitles'),
    },
    {
      key: 'always',
      value: t('always'),
    },
  ];

  const [subtitleColor, setSubtitleColor] = React.useState(
    t(clientSettings['subtitleColor'] as string),
  );
  const [subtitleSize, setSubtitleSize] = React.useState(
    t(clientSettings['subtitleSize'] as string),
  );
  const [subtitlePosition, setSubtitlePosition] = React.useState(
    t(clientSettings['subtitlePosition'] as string),
  );
  const [subtitleBurn, setSubtitleBurn] = React.useState(
    subtitleBurnOptions.find(
      (option) => option.key === (clientSettings['burntSubtitles'] as string),
    )?.value || subtitleBurnOptions[0].value,
  );

  const handleSave = () => {
    setClientSetting('subtitleColor', subtitleColor);
    setClientSetting('subtitleSize', subtitleSize);
    setClientSetting('subtitlePosition', subtitlePosition);
    setClientSetting('burntSubtitles', subtitleBurn);

    setClientSettings({
      ...clientSettings,
      subtitleColor: subtitleColor,
      subtitleSize: subtitleSize,
      subtitlePosition: subtitlePosition,
      burntSubtitles: subtitleBurn,
    });

    setIsDirty(false);

    setShowMessage(true);

    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  const handleSubtitleColorChange = (key: string) => {
    setSubtitleColor(key);
    setIsDirty(true);
  };

  const handleSubtitlePositionChange = (key: string) => {
    setSubtitlePosition(key);
    setIsDirty(true);
  };

  const handleSubtitleSizeChange = (key: string) => {
    setSubtitleSize(key);
    setIsDirty(true);
  };

  const handleSubtitleBurnChange = (key: string) => {
    setSubtitleBurn(key);
    setIsDirty(true);
  };

  return (
    <ContentWrapper group={t('client')} section={t('player')}>
      <LabeledInputWrapper direction="row" label={t('subtitleColor')}>
        <SelectableWrapper
          options={subtitleColorOptions}
          defaultValue={subtitleColor}
          onValueChange={handleSubtitleColorChange}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('subtitlePosition')}>
        <SelectableWrapper
          options={subtitlePositionOptions}
          defaultValue={subtitlePosition}
          onValueChange={handleSubtitlePositionChange}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('subtitleSize')}>
        <SelectableWrapper
          options={subtitleSizeOptions}
          defaultValue={subtitleSize}
          onValueChange={handleSubtitleSizeChange}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        direction="row"
        label={t('subtitleBurn')}
        text={t('subtitleBurnMessage')}
      >
        <SelectableWrapper
          options={subtitleBurnOptions}
          defaultValue={subtitleBurn}
          onValueChange={handleSubtitleBurnChange}
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

export default ClientPlayer;
