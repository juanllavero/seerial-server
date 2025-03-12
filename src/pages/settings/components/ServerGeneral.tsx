import LabeledInputWrapper from '@/components/form/labeledInputWrapper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { Check, CloudDownload } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'

function ServerGeneral() {
  const { t } = useTranslation()
  const [ip, setIP] = useState<string>('')
  const [isDirty, setIsDirty] = React.useState(false)

  const [autoUpdate, setAutoUpdate] = useState<boolean>(false)

  return (
    <ContentWrapper>
      <span className="mb-4 text-3xl font-bold">
        {t('server')} - {t('generalButton')}
      </span>

      <FlexBox wrap="wrap" gap={2} align="center">
        <span>Versión 1.41.4.9463</span>
        <Button variant={'secondary'}>
          <CloudDownload className="mr-3" />
          Buscar actualizaciones
        </Button>
        <FlexBox gap={0.5}>
          <Check />
          <span>Actualizado</span>
        </FlexBox>
      </FlexBox>

      <LabeledInputWrapper label={t('serverIP')} text={t('serverIPMessage')}>
        <Input
          placeholder="192.168.1.10:34200..."
          type="text"
          value={ip}
          onChange={(e) => {
            setIP(e.target.value)
          }}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        direction="row"
        label={t('autoUpdate')}
        text={t('autoUpdateMessage')}
      >
        <Checkbox checked={autoUpdate} />
      </LabeledInputWrapper>

      <Button disabled={!isDirty}>{t('saveButton')}</Button>
    </ContentWrapper>
  )
}

export default ServerGeneral
