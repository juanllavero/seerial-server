import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import ISO6391 from 'iso-639-1'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import { Settings } from '@/data/interfaces/Utils'

interface ServerLanguagesProps {
  serverSettings: Settings
  setServerSettings: (newSettings: Settings) => void
}

function ServerLanguages({
  serverSettings,
  setServerSettings,
}: ServerLanguagesProps) {
  const { t, i18n } = useTranslation()
  const { serverIP } = useServerStore()
  const { setServerSetting } = useSettingsStore()
  const currentLanguage = i18n.language?.split('-')[0] ?? 'en'
  const [isDirty, setIsDirty] = useState(false)

  const [showMessage, setShowMessage] = useState(false)

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

  const [autoSelectTracks, setAutoSelectTracks] = useState<boolean>(
    (serverSettings['autoSelectTracks'] as boolean) ?? true,
  )
  const [preferAudioLan, setPreferAudioLan] = useState<string>(
    ISO6391.getNativeName(
      (serverSettings['preferAudioLan'] as string).split('-')[0],
    ) || currentLanguage,
  )
  const [subsMode, setSubsMode] = useState<string>(
    subtitleModeOptions.find(
      (option) => option.key === serverSettings['subsMode'],
    )?.value || subtitleModeOptions[0].value,
  )
  const [preferSubLan, setPreferSubLan] = useState<string>(
    ISO6391.getNativeName(
      (serverSettings['preferSubsLan'] as string).split('-')[0],
    ) || currentLanguage,
  )

  const languageCodes = ISO6391.getAllCodes()

  const languagesOptions = languageCodes.map((code) => ({
    key: code,
    value: ISO6391.getNativeName(code),
  }))

  const handleSave = () => {
    setServerSetting(serverIP, 'autoSelectTracks', autoSelectTracks)
    setServerSetting(
      serverIP,
      'preferAudioLan',
      ISO6391.getCode(preferAudioLan),
    )
    setServerSetting(serverIP, 'subsMode', subsMode)
    setServerSetting(serverIP, 'preferSubsLan', ISO6391.getCode(preferSubLan))

    setServerSettings({
      ...serverSettings,
      autoSelectTracks: autoSelectTracks,
      preferAudioLan: ISO6391.getCode(preferAudioLan),
      subsMode: subsMode,
      preferSubsLan: ISO6391.getCode(preferSubLan),
    })

    setIsDirty(false)

    setShowMessage(true)

    setTimeout(() => {
      setShowMessage(false)
    }, 2000)
  }

  const handleAutoSelectTracksChange = (value: boolean) => {
    setAutoSelectTracks(value)
    setIsDirty(true)
  }

  const handlePreferAudioLanChange = (key: string) => {
    setPreferAudioLan(key)
    setIsDirty(true)
  }

  const handleSubsModeChange = (key: string) => {
    setSubsMode(key)
    setIsDirty(true)
  }

  const handlePreferSubLanChange = (key: string) => {
    setPreferSubLan(key)
    setIsDirty(true)
  }

  return (
    <ContentWrapper group={t('server')} section={t('languages')}>
      {preferAudioLan === '' || subsMode === '' || preferSubLan === '' ? (
        <Loading />
      ) : (
        <>
          <LabeledInputWrapper direction="row" label={t('autoSelectTracks')}>
            <Checkbox
              checked={autoSelectTracks}
              onCheckedChange={handleAutoSelectTracksChange}
            />
          </LabeledInputWrapper>

          <LabeledInputWrapper direction="row" label={t('preferAudio')}>
            <SelectableWrapper
              options={languagesOptions}
              defaultValue={preferAudioLan}
              onValueChange={handlePreferAudioLanChange}
            />
          </LabeledInputWrapper>

          <LabeledInputWrapper direction="row" label={t('subsMode')}>
            <SelectableWrapper
              options={subtitleModeOptions}
              defaultValue={subsMode}
              onValueChange={handleSubsModeChange}
            />
          </LabeledInputWrapper>

          <LabeledInputWrapper direction="row" label={t('preferSubs')}>
            <SelectableWrapper
              options={languagesOptions}
              defaultValue={preferSubLan}
              onValueChange={handlePreferSubLanChange}
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
        </>
      )}
    </ContentWrapper>
  )
}

export default ServerLanguages
