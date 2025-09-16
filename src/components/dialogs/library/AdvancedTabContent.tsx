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
  edit?: boolean
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
  edit,
}: AdvancedTabContentProps) {
  const { t, i18n } = useTranslation()
  const serverUrl = useServerStore((state) => state.serverUrl)
  const getServerSetting = useSettingsStore((state) => state.getServerSetting)
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
      serverUrl,
      'preferAudioLan',
      currentLanguage,
    )
    // FIX: Convert prefAudio to a string before calling .split()
    return (
      ISO6391.getNativeName(String(prefAudio).split('-')[0]) || currentLanguage
    )
  }

  const getPrefSubLan = async () => {
    const prefSub = await getServerSetting(
      serverUrl,
      'preferSubsLan',
      currentLanguage,
    )
    // FIX: Convert prefSub to a string before calling .split()
    return (
      ISO6391.getNativeName(String(prefSub).split('-')[0]) || currentLanguage
    )
  }

  const getSubsMode = async () => {
    const subs = await getServerSetting(serverUrl, 'subsMode', 'autoSubs')
    // FIX: Convert subs to a string before passing to the translation function
    return t(String(subs))
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
  }, [serverUrl])

  return (
    <FlexBox
      direction="column"
      gap={1}
      align="stretch"
      justify="space-between"
      height={'27rem'}
      width={'100%'}
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
          {t(edit ? 'saveButton' : 'addButton')}
        </Button>
      </FlexBox>
    </FlexBox>
  )
}

export default AdvancedTabContent
