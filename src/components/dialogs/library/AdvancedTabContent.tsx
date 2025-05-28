import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import ISO6391 from 'iso-639-1'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface AdvancedTabContentProps {
  preferAudioLan: string | undefined
  setPreferAudioLan: (language: string | undefined) => void
  preferSubLan: string | undefined
  setPreferSubLan: (language: string | undefined) => void
  subsMode: string | undefined
  setSubsMode: (mode: string | undefined) => void
  buttonDisabled: boolean
  handleAddLibrary: () => void
  close: () => void
}

function AdvancedTabContent({
  preferAudioLan,
  setPreferAudioLan,
  preferSubLan,
  setPreferSubLan,
  subsMode,
  setSubsMode,
  buttonDisabled,
  handleAddLibrary,
  close,
}: AdvancedTabContentProps) {
  const { t, i18n } = useTranslation()
  const { selectedServer } = useServerStore()
  const { getServerSetting } = useSettingsStore()
  const currentLanguage = i18n.language?.split('-')[0] ?? 'en'
  const languageCodes = ISO6391.getAllCodes()

  const languagesOptions = languageCodes.map((code) => ({
    key: code,
    value: ISO6391.getNativeName(code),
  }))

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

  const getPrefAudioLan = async () => {
    const prefAudio = await getServerSetting(
      selectedServer?.ip ?? '',
      'preferAudioLan',
      currentLanguage,
    )
    return ISO6391.getNativeName(prefAudio.split('-')[0]) || currentLanguage
  }

  const getPrefSubLan = async () => {
    const prefSub = await getServerSetting(
      selectedServer?.ip ?? '',
      'preferSubsLan',
      currentLanguage,
    )
    return ISO6391.getNativeName(prefSub.split('-')[0]) || currentLanguage
  }

  const getSubsMode = async () => {
    const subs = await getServerSetting(
      selectedServer?.ip ?? '',
      'subsMode',
      'autoSubs',
    )
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
  }, [selectedServer])

  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={'25rem'}
      width={'30rem'}
    >
      <FlexBox direction="column" gap={1}>
        <LabeledInputWrapper direction="row" label={t('preferAudio')}>
          <SelectableWrapper
            options={languagesOptions}
            defaultValue={preferAudioLan ?? ''}
            onValueChange={(_key: string, value: string) =>
              setPreferAudioLan(value)
            }
          />
        </LabeledInputWrapper>

        <LabeledInputWrapper direction="row" label={t('subsMode')}>
          <SelectableWrapper
            options={subtitleModeOptions}
            defaultValue={subsMode ?? ''}
            onValueChange={(_key: string, value: string) => setSubsMode(value)}
          />
        </LabeledInputWrapper>

        <LabeledInputWrapper direction="row" label={t('preferSubs')}>
          <SelectableWrapper
            options={languagesOptions}
            defaultValue={preferSubLan ?? ''}
            onValueChange={(_key: string, value: string) =>
              setPreferSubLan(value)
            }
          />
        </LabeledInputWrapper>
      </FlexBox>

      <FlexBox width={'100%'} justify="end" gap={1}>
        <Button variant={'secondary'} onClick={close}>
          {t('cancelButton')}
        </Button>
        <Button onClick={handleAddLibrary} disabled={buttonDisabled}>
          {t('addButton')}
        </Button>
      </FlexBox>
    </FlexBox>
  )
}

export default AdvancedTabContent
