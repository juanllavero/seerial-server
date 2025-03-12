import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'

function ServerTranscode() {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = React.useState(false)

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
  ]

  return (
    <ContentWrapper>
      <span className="mb-4 text-3xl font-bold">
        {t('server')} - {t('transcode')}
      </span>

      <LabeledInputWrapper
        label={t('tempFolder')}
        text={t('tempFolderMessage')}
      >
        <Input type="text" />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        label={t('defaultBuffer')}
        text={t('defaultBufferMessage')}
      >
        <Input type="number" min={0} max={300} defaultValue={60} />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        label={t('transcoderPreset')}
        text={t('transcoderPresetMessage')}
      >
        <SelectableWrapper
          defaultValue={transcoderOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
          options={transcoderOptions}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('maxTranscoding')}>
        <Input type="number" min={0} defaultValue={4} />
      </LabeledInputWrapper>

      <Button disabled={!isDirty}>{t('saveButton')}</Button>
    </ContentWrapper>
  )
}

export default ServerTranscode
