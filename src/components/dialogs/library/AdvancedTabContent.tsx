import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import ISO6391 from 'iso-639-1'
import React from 'react'
import { useTranslation } from 'react-i18next'

function AdvancedTabContent() {
  const { t } = useTranslation()
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
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={'25rem'}
      width={'30rem'}
    >
      <FlexBox direction="column" gap={1}>
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
      </FlexBox>

      <FlexBox width={'100%'} justify="end" gap={1}>
        <Button variant={'secondary'}>{t('cancelButton')}</Button>
        <Button>{t('next')}</Button>
      </FlexBox>
    </FlexBox>
  )
}

export default AdvancedTabContent
