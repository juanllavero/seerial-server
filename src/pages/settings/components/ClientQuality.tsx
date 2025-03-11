import LabeledInputWrapper from '@/components/form/labeledInputWrapper'
import FlexBox from '@/components/ui/FlexBox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import React from 'react'
import { useTranslation } from 'react-i18next'

function ClientQuality() {
  const { t } = useTranslation()

  const qualityOptions = [
    { key: '20 Mbps, 1080p', value: '20 Mbps, 1080p' },
    { key: '15 Mbps, 1080p', value: '15 Mbps, 1080p' },
    { key: '12 Mbps, 1080p', value: '12 Mbps, 1080p' },
    { key: '10 Mbps, 1080p', value: '10 Mbps, 1080p' },
    { key: '8 Mbps, 1080p', value: '8 Mbps, 1080p' },
    { key: '6 Mbps, 1080p', value: '6 Mbps, 1080p' },
    { key: '4 Mbps, 720p', value: '4 Mbps, 720p' },
    { key: '2 Mbps, 720p', value: '2 Mbps, 720p' },
    { key: '1 Mbps, 480p', value: '1 Mbps, 480p' },
    { key: '0.7 Mbps, 480p', value: '0.7 Mbps, 480p' },
    { key: '0.5 Mbps, 360p', value: '0.5 Mbps, 360p' },
    { key: '0.2 Mbps, 360p', value: '0.2 Mbps, 360p' },
  ]

  return (
    <FlexBox direction="column" gap={1.5}>
      <span className="mb-4 text-3xl font-bold">
        {t('client')} - {t('quality')}
      </span>

      <span className="text-lg font-semibold">{t('localStreaming')}</span>

      <span className="text-lg font-semibold">{t('onlineStreaming')}</span>

      <LabeledInputWrapper direction="row" label={t('videoQuality')}>
        <SelectableWrapper
          options={qualityOptions}
          defaultValue={'1080p'}
          onValueChange={function (key: string, value: string): void {}}
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default ClientQuality
