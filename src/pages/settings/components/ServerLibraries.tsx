import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'

function ServerLibraries() {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = useState<boolean>(false)

  const scanOptions = [
    {
      key: 'never',
      value: t('never'),
    },
    {
      key: 'min15',
      value: t('min15'),
    },
    {
      key: 'min30',
      value: t('min30'),
    },
    {
      key: 'h1',
      value: t('h1'),
    },
    {
      key: 'h2',
      value: t('h2'),
    },
    {
      key: 'h6',
      value: t('h6'),
    },
    {
      key: 'h12',
      value: t('h12'),
    },
    {
      key: 'daily',
      value: t('daily'),
    },
  ]

  const chapterOptions = [
    {
      key: 'never',
      value: t('never'),
    },
    {
      key: 'asTask',
      value: t('asTask'),
    },
    {
      key: 'asTaskAndFileUpdate',
      value: t('asTaskAndFileUpdate'),
    },
  ]

  return (
    <ContentWrapper>
      <span className="mb-4 text-3xl font-bold">
        {t('server')} - {t('libraries')}
      </span>

      <LabeledInputWrapper
        direction="row"
        label={t('autoScan')}
        text={t('autoScanMessage')}
      >
        <Checkbox />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('scanOptions')}>
        <SelectableWrapper
          options={scanOptions}
          defaultValue={scanOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('generateThumbnailsCheck')}>
        <SelectableWrapper
          options={chapterOptions}
          defaultValue={chapterOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <Button disabled={!isDirty}>{t('saveButton')}</Button>
    </ContentWrapper>
  )
}

export default ServerLibraries
