import LabeledInputWrapper from '@/components/form/labeledInputWrapper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import ISO6391 from 'iso-639-1'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'

function ServerLanguages() {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = React.useState(false)

  const languageCodes = ISO6391.getAllCodes()

  const languagesOptions = languageCodes.map((code) => ({
    key: code,
    value: ISO6391.getNativeName(code),
  }))

  const subtitleModeOptions = [
    {
      key: 'manualSubs',
      value: t('manualSubs'),
    },
    {
      key: 'autoSubs',
      value: t('autoSubs'),
    },
    {
      key: 'alwaysSubs',
      value: t('alwaysSubs'),
    },
  ]

  return (
    <ContentWrapper>
      <span className="mb-4 text-3xl font-bold">
        {t('server')} - {t('languages')}
      </span>

      <LabeledInputWrapper direction="row" label={t('autoSelectTracks')}>
        <Checkbox />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('preferAudio')}>
        <SelectableWrapper
          options={languagesOptions}
          defaultValue={languagesOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('subsMode')}>
        <SelectableWrapper
          options={subtitleModeOptions}
          defaultValue={subtitleModeOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('preferSubs')}>
        <SelectableWrapper
          options={languagesOptions}
          defaultValue={languagesOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <Button disabled={!isDirty}>{t('saveButton')}</Button>
    </ContentWrapper>
  )
}

export default ServerLanguages
