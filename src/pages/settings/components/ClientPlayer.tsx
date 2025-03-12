import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'

function ClientPlayer() {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = React.useState(false)

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
  ]

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
      key: 'medium',
      value: t('medium'),
    },
    {
      key: 'big',
      value: t('big'),
    },
    {
      key: 'large',
      value: t('large'),
    },
  ]

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
  ]

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
  ]

  return (
    <ContentWrapper>
      <span className="mb-4 text-3xl font-bold">
        {t('client')} - {t('player')}
      </span>

      <LabeledInputWrapper direction="row" label={t('subtitleColor')}>
        <SelectableWrapper
          options={subtitleColorOptions}
          defaultValue={subtitleColorOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('subtitlePosition')}>
        <SelectableWrapper
          options={subtitlePositionOptions}
          defaultValue={subtitlePositionOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('subtitleSize')}>
        <SelectableWrapper
          options={subtitleSizeOptions}
          defaultValue={subtitleSizeOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        direction="row"
        label={t('subtitleBurn')}
        text={t('subtitleBurnMessage')}
      >
        <SelectableWrapper
          options={subtitleBurnOptions}
          defaultValue={subtitleBurnOptions[0].value}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>

      <Button disabled={!isDirty}>{t('saveButton')}</Button>
    </ContentWrapper>
  )
}

export default ClientPlayer
