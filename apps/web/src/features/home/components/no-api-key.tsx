import { useServerStore } from '@seerial/stores';
import React from 'react';
import { useTranslation } from 'react-i18next';
import LabeledInputWrapper from '@/shared/forms/labeled-input-wrapper';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import AlertContent from './alert-content';

function NoAPIKey() {
  const { t } = useTranslation();
  const saveApiKey = useServerStore((state) => state.setApiKey);
  const [disableButton, setDisableButton] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');

  const saveAPIKey = async () => {
    setDisableButton(true);
    await saveApiKey(apiKey);
    setDisableButton(false);
  };

  return (
    <AlertContent
      title={t('apiKeyTitle')}
      message={t('apiKeyMessage')}
      url="https://www.themoviedb.org/settings/api"
    >
      <FlexBox padding="1rem">
        <LabeledInputWrapper label={t('apiKey')}>
          <FlexBox gap={1}>
            <Input
              placeholder={`${t('apiKey')}...`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button disabled={disableButton} onClick={saveAPIKey}>
              {t('saveButton')}
            </Button>
          </FlexBox>
        </LabeledInputWrapper>
      </FlexBox>
    </AlertContent>
  );
}

export default NoAPIKey;
