import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import { useSettingsStore } from '@/context/settings.context'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'
import { shallow } from 'zustand/shallow'

function ClientQuality() {
  const { t } = useTranslation()
  const { setClientSetting, clientSettings, setClientSettings } =
    useSettingsStore(
      (state) => ({
        setClientSetting: state.setClientSetting,
        clientSettings: state.clientSettings,
        setClientSettings: state.setClientSettings,
      }),
      shallow,
    )
  const [isDirty, setIsDirty] = React.useState(false)
  const [showMessage, setShowMessage] = React.useState(false)

  const qualityOptions = [
    { key: 'Original', value: 'Original' },
    { key: '20 Mbps, 1080p', value: '20 Mbps, 1080p' },
    { key: '15 Mbps, 1080p', value: '15 Mbps, 1080p' },
    { key: '12 Mbps, 1080p', value: '12 Mbps, 1080p' },
    { key: '10 Mbps, 1080p', value: '10 Mbps, 1080p' },
    { key: '8 Mbps, 1080p', value: '8 Mbps, 1080p' },
    { key: '6 Mbps, 720p', value: '6 Mbps, 720p' },
    { key: '4 Mbps, 720p', value: '4 Mbps, 720p' },
    { key: '2 Mbps, 720p', value: '2 Mbps, 720p' },
    { key: '1 Mbps, 480p', value: '1 Mbps, 480p' },
    { key: '0.7 Mbps, 480p', value: '0.7 Mbps, 480p' },
    { key: '0.5 Mbps, 360p', value: '0.5 Mbps, 360p' },
    { key: '0.2 Mbps, 360p', value: '0.2 Mbps, 360p' },
  ]

  const [localQuality, setLocalQuality] = React.useState(
    qualityOptions.find(
      (option) =>
        option.key === (clientSettings['localVideoQuality'] as string),
    )?.key || qualityOptions[0].key,
  )
  const [onlineQuality, setOnlineQuality] = React.useState(
    qualityOptions.find(
      (option) =>
        option.key === (clientSettings['onlineVideoQuality'] as string),
    )?.key || qualityOptions[0].key,
  )

  const handleSave = () => {
    setClientSetting('localVideoQuality', localQuality)
    setClientSetting('onlineVideoQuality', onlineQuality)

    setClientSettings({
      ...clientSettings,
      localVideoQuality: localQuality,
      onlineVideoQuality: onlineQuality,
    })

    setIsDirty(false)

    setShowMessage(true)

    setTimeout(() => {
      setShowMessage(false)
    }, 2000)
  }

  const handleLocalQualityChange = (key: string) => {
    setLocalQuality(key)
    setIsDirty(true)
  }

  const handleOnlineQualityChange = (key: string) => {
    setOnlineQuality(key)
    setIsDirty(true)
  }

  return (
    <ContentWrapper group={t('client')} section={t('quality')}>
      <span className="text-lg font-semibold">{t('localStreaming')}</span>

      <LabeledInputWrapper direction="row" label={t('videoQuality')}>
        <SelectableWrapper
          options={qualityOptions}
          defaultValue={localQuality}
          onValueChange={handleLocalQualityChange}
        />
      </LabeledInputWrapper>

      <span className="text-lg font-semibold">{t('onlineStreaming')}</span>

      <LabeledInputWrapper direction="row" label={t('videoQuality')}>
        <SelectableWrapper
          options={qualityOptions}
          defaultValue={onlineQuality}
          onValueChange={handleOnlineQualityChange}
        />
      </LabeledInputWrapper>

      <FlexBox gap={1} justify="center" align="center">
        <Button disabled={!isDirty} onClick={handleSave}>
          {t('saveButton')}
        </Button>
        {showMessage && (
          <span className="text-muted-foreground text-sm">
            ✔ {t('changesSaved')}
          </span>
        )}
      </FlexBox>
    </ContentWrapper>
  )
}

export default ClientQuality
