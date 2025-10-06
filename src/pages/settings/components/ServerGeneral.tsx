import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import { Check, CloudDownload } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'
import { shallow } from 'zustand/shallow'

function ServerGeneral({ isLoaded }: { isLoaded: boolean }) {
  const { t } = useTranslation()
  const { serverUrl } = useServerStore(
    (state) => ({
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const { setServerSetting, serverSettings, setServerSettings } =
    useSettingsStore(
      (state) => ({
        setServerSetting: state.setServerSetting,
        serverSettings: state.serverSettings,
        setServerSettings: state.setServerSettings,
      }),
      shallow,
    )
  const [isDirty, setIsDirty] = React.useState(false)
  const [showMessage, setShowMessage] = useState(false)

  const [ip, setIP] = useState<string>(serverUrl ?? '')
  const [autoUpdate, setAutoUpdate] = useState<boolean>(
    (serverSettings['automaticUpdates'] as boolean) ?? false,
  )

  const handleSave = () => {
    if (serverUrl === '') return

    setServerSetting(serverUrl, 'automaticUpdates', autoUpdate)

    setServerSettings({
      ...serverSettings,
      automaticUpdates: autoUpdate,
    })

    setIsDirty(false)

    setShowMessage(true)

    setTimeout(() => {
      setShowMessage(false)
    }, 2000)
  }

  const handleIPChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIP(event.target.value)

    setTimeout(() => {
      changeIP(event.target.value)
    }, 1000)
  }

  const changeIP = (ip: string) => {
    //setserverUrl(ip)
  }

  const handleAutoUpdateChange = (checked: boolean) => {
    setAutoUpdate(checked)
    setIsDirty(true)
  }

  const handleSearchUpdates = () => {
    console.log('search updates')
  }

  return (
    <ContentWrapper group={t('server')} section={t('generalButton')}>
      <FlexBox wrap="wrap" gap={2} align="center">
        <span>
          {t('version')} {'None'}
        </span>
        <Button variant={'secondary'} onClick={handleSearchUpdates}>
          <CloudDownload className="mr-3" />
          {t('searchUpdates')}
        </Button>
        <FlexBox gap={0.5}>
          <Check />
          <span>{t('updated')}</span>
        </FlexBox>
      </FlexBox>

      <LabeledInputWrapper label={t('serverUrl')} text={t('serverUrlMessage')}>
        <FlexBox align="center" gap={1}>
          <Input
            placeholder="192.168.1.10:34200..."
            type="text"
            value={ip}
            onChange={handleIPChange}
          />
          <Button onClick={() => changeIP(ip)}>{t('checkButton')}</Button>
        </FlexBox>
      </LabeledInputWrapper>

      <LabeledInputWrapper
        direction="row"
        label={t('autoUpdate')}
        text={t('autoUpdateMessage')}
      >
        <Checkbox
          checked={autoUpdate}
          disabled={!isLoaded}
          onCheckedChange={handleAutoUpdateChange}
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

export default ServerGeneral
