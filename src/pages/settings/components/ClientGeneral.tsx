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

function ClientGeneral({ clientSettings }: { clientSettings: Settings }) {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = React.useState(false)
  const { serverIP } = useServerStore()
  const { setServerSetting } = useSettingsStore()
  const [showMessage, setShowMessage] = React.useState(false)

  const [playMusic, setPlayMusic] = React.useState(true)
  const [musicVolume, setMusicVolume] = React.useState(100)
  const [timeFormat, setTimeFormat] = React.useState<string>('24h')

  const handleSave = () => {
    setServerSetting(serverIP, 'playBackgroundMusic', playMusic)
    setIsDirty(false)

    setShowMessage(true)

    setTimeout(() => {
      setShowMessage(false)
    }, 2000)
  }

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
