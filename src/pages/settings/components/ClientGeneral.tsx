import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import LangToggle from '@/components/LangToggle'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'
import { Settings } from '@/data/interfaces/Utils'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'

const TimeFormatOptions = [
  {
    key: '12h',
    value: '12h',
  },
  {
    key: '24h',
    value: '24h',
  },
]

interface ClientGeneralProps {
  clientSettings: Settings
  setClientSettings: (newSettings: Settings) => void
}

function ClientGeneral({
  clientSettings,
  setClientSettings,
}: ClientGeneralProps) {
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { setClientSetting } = useSettingsStore()
  const [isDirty, setIsDirty] = React.useState(false)
  const [showMessage, setShowMessage] = React.useState(false)

  const [playMusic, setPlayMusic] = React.useState(
    clientSettings['playBackgroundMusic'] as boolean,
  )
  const [musicVolume, setMusicVolume] = React.useState(
    clientSettings['backgroundMusicVolume'] as number,
  )
  const [timeFormat, setTimeFormat] = React.useState(
    clientSettings['timeFormat'] as string,
  )

  const handlePlayBackgroundMusicChange = (checked: boolean) => {
    setPlayMusic(checked)
    setIsDirty(true)
  }

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMusicVolume(Number(e.target.value))
    setIsDirty(true)
  }

  const handleTimeFormatChange = (key: string) => {
    setTimeFormat(key)
    setIsDirty(true)
  }

  const handleSave = () => {
    setClientSetting(serverIP, 'playBackgroundMusic', playMusic)
    setClientSetting(serverIP, 'backgroundMusicVolume', musicVolume)
    setClientSetting(serverIP, 'timeFormat', timeFormat)

    setClientSettings({
      ...clientSettings,
      playBackgroundMusic: playMusic,
      backgroundMusicVolume: musicVolume,
      timeFormat: timeFormat,
    })

    setIsDirty(false)

    setShowMessage(true)

    setTimeout(() => {
      setShowMessage(false)
    }, 2000)
  }

  return (
    <ContentWrapper group={t('client')} section={t('generalButton')}>
      <LabeledInputWrapper direction="row" label={t('languageText')}>
        <LangToggle />
      </LabeledInputWrapper>

      <LabeledInputWrapper
        direction="row"
        label={t('playBackgroundMusic')}
        text={t('playBackgroundMusicMessage')}
      >
        <Checkbox
          checked={playMusic}
          onCheckedChange={handlePlayBackgroundMusicChange}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('musicVolume')}>
        <Input
          min={0}
          max={100}
          value={musicVolume}
          onChange={handleMusicVolumeChange}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('timeFormat')}>
        <SelectableWrapper
          options={TimeFormatOptions}
          defaultValue={timeFormat}
          onValueChange={handleTimeFormatChange}
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

export default ClientGeneral
