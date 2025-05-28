import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'

function ServerTranscode() {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = React.useState(false)
  const [showMessage, setShowMessage] = React.useState(false)
  const { selectedServer } = useServerStore()
  const { setServerSetting, serverSettings, setServerSettings } =
    useSettingsStore()

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

  const [tempFolder, setTempFolder] = useState<string>(
    (serverSettings['tempTranscodeFolder'] as string) ?? '',
  )
  const [transcoderPreset, setTranscoderPreset] = useState<string>(
    (serverSettings['transcodePreset'] as string) ?? transcoderOptions[0].value,
  )
  const [defaultBuffer, setDefaultBuffer] = useState<number>(
    (serverSettings['transcodeBuffer'] as number) ?? 60,
  )
  const [maxTranscoding, setMaxTranscoding] = useState<number>(
    (serverSettings['maxTranscodeProcesses'] as number) ?? 4,
  )

  const handleTranscoderPresetChange = (key: string) => {
    setTranscoderPreset(key)
    setIsDirty(true)
  }

  const handleSelectFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempFolder(e.target.value)
    setIsDirty(true)
  }

  const handleDefaultBufferChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDefaultBuffer(parseInt(e.target.value))
    setIsDirty(true)
  }

  const handleMaxTranscodingChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setMaxTranscoding(parseInt(e.target.value))
    setIsDirty(true)
  }

  const handleSave = () => {
    if (!selectedServer) return
    setServerSetting(selectedServer.ip, 'tempTranscodeFolder', tempFolder)
    setServerSetting(selectedServer.ip, 'transcodePreset', transcoderPreset)
    setServerSetting(selectedServer.ip, 'transcodeBuffer', defaultBuffer)
    setServerSetting(selectedServer.ip, 'maxTranscodeProcesses', maxTranscoding)

    setServerSettings({
      ...serverSettings,
      tempTranscodeFolder: tempFolder,
      transcodePreset: transcoderPreset,
      transcodeBuffer: defaultBuffer,
      maxTranscodeProcesses: maxTranscoding,
    })

    setIsDirty(false)

    setShowMessage(true)

    setTimeout(() => {
      setShowMessage(false)
    }, 2000)
  }

  return (
    <ContentWrapper group={t('server')} section={t('transcode')}>
      <LabeledInputWrapper
        label={t('tempFolder')}
        text={t('tempFolderMessage')}
      >
        <Input type="text" value={tempFolder} onChange={handleSelectFolder} />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        label={t('defaultBuffer')}
        text={t('defaultBufferMessage')}
      >
        <Input
          type="number"
          min={0}
          max={300}
          defaultValue={60}
          value={defaultBuffer}
          onChange={handleDefaultBufferChange}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        label={t('transcoderPreset')}
        text={t('transcoderPresetMessage')}
      >
        <SelectableWrapper
          defaultValue={transcoderPreset}
          onValueChange={handleTranscoderPresetChange}
          options={transcoderOptions}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('maxTranscoding')}>
        <Input
          type="number"
          min={0}
          defaultValue={4}
          value={maxTranscoding}
          onChange={handleMaxTranscodingChange}
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

export default ServerTranscode
