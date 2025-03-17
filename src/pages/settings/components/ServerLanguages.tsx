import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import ISO6391 from 'iso-639-1'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'

function ServerLanguages() {
  const { t, i18n } = useTranslation()
  const { serverIP } = useServerStore()
  const { getServerSetting, setServerSetting } = useSettingsStore()
  const currentLanguage = i18n.language?.split('-')[0] ?? 'en'
  const [isDirty, setIsDirty] = React.useState(false)

  const [showMessage, setShowMessage] = React.useState(false)

  const [preferAudioLan, setPreferAudioLan] = React.useState('')
  const [subsMode, setSubsMode] = React.useState('')
  const [preferSubLan, setPreferSubLan] = React.useState('')

  const languageCodes = ISO6391.getAllCodes()

  const languagesOptions = languageCodes.map((code) => ({
    key: code,
    value: ISO6391.getNativeName(code),
  }))

  const getPrefAudioLan = async () => {
    const prefAudio = await getServerSetting(serverIP, 'preferAudioLan', currentLanguage)
    return ISO6391.getNativeName(prefAudio.split('-')[0]) || currentLanguage
  }

  const getPrefSubLan = async () => {
    const prefSub = await getServerSetting(serverIP, 'preferSubsLan', currentLanguage)
    return ISO6391.getNativeName(prefSub.split('-')[0]) || currentLanguage
  }

  const getSubsMode = async () => {
    const subs = await getServerSetting(serverIP, 'subsMode', 'autoSubs')
    return t(subs)
  }

  useEffect(() => {
    const setValues = async () => {
      const prefAudio = await getPrefAudioLan()
      setPreferAudioLan(prefAudio)
      const subs = await getSubsMode()
      setSubsMode(subs)
      const prefSub = await getPrefSubLan()
      setPreferSubLan(prefSub)
    }

    setValues()
  }, [serverIP])

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

  const handleSave = () => {
    console.log({ preferAudioLan, subsMode, preferSubLan })

    setServerSetting(serverIP, 'preferAudioLan', ISO6391.getCode(preferAudioLan))
    setServerSetting(serverIP, 'subsMode', subsMode)
    setServerSetting(serverIP, 'preferSubsLan', ISO6391.getCode(preferSubLan))
    setIsDirty(false)

    setShowMessage(true)

    setTimeout(() => {
      setShowMessage(false)
    }, 2000)
  }

  const handlePreferAudioLanChange = (_key: string, value: string) => {
    setPreferAudioLan(value)
    setIsDirty(true)
  }

  const handleSubsModeChange = (key: string) => {
    setSubsMode(key)
    setIsDirty(true)
  }

  const handlePreferSubLanChange = (_key: string, value: string) => {
    setPreferSubLan(value)
    setIsDirty(true)
  }

  return (
    <ContentWrapper>
      <span className="mb-4 text-3xl font-bold">
        {t('server')} - {t('languages')}
      </span>

      {
        preferAudioLan === '' || subsMode === '' || preferSubLan === '' ? (
          <Loading />
        ) : (
          <>
            <LabeledInputWrapper direction="row" label={t('autoSelectTracks')}>
              <Checkbox />
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

            <FlexBox gap={1} justify='center' align='center'>
              <Button disabled={!isDirty} onClick={handleSave}>{t('saveButton')}</Button>
              {showMessage && (
                <span className="text-sm text-muted-foreground">
                  ✔ {t('changesSaved')}
                </span>
              )}
            </FlexBox>
          </>
        )
      }
    </ContentWrapper>
  )
}

export default ServerLanguages
