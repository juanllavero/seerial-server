import LabeledInputWrapper from '@/components/form/labeledInputWrapper'
import LangToggle from '@/components/LangToggle'
import { Checkbox } from '@/components/ui/checkbox'
import FlexBox from '@/components/ui/FlexBox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import React from 'react'
import { useTranslation } from 'react-i18next'

function ClientGeneral() {
  const { t } = useTranslation()
  const [checked, setChecked] = React.useState(true)

  return (
    <FlexBox direction="column" gap={1.5}>
      <span className="mb-4 text-3xl font-bold">
        {t('client')} - {t('generalButton')}
      </span>
      <LabeledInputWrapper direction="row" label={t('languageText')}>
        <LangToggle />
      </LabeledInputWrapper>
      <LabeledInputWrapper
        direction="row"
        label={t('playBackgroundMusic')}
        text={t('playBackgroundMusicMessage')}
      >
        <Checkbox checked={checked} />
      </LabeledInputWrapper>
      <LabeledInputWrapper direction="row" label={t('timeFormat')}>
        <SelectableWrapper
          options={[
            { key: '12', value: '12h' },
            { key: '24', value: '24h' },
          ]}
          defaultValue={'24h'}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default ClientGeneral
