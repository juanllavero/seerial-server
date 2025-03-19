import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContentWrapper from './utils/ContentWrapper'
import { Settings } from '@/data/interfaces/Utils'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import FlexBox from '@/components/ui/FlexBox'

interface ServerLibrariesProps {
  serverSettings: Settings
  setServerSettings: (newSettings: Settings) => void
}

function ServerLibraries({
  serverSettings,
  setServerSettings,
}: ServerLibrariesProps) {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [showMessage, setShowMessage] = useState(false)
  const { serverIP } = useServerStore()
  const { setServerSetting } = useSettingsStore()

  const scanOptions = [
    {
      key: 'never',
      value: t('never'),
    },
    {
      key: 'min15',
      value: t('min15'),
    },
    {
      key: 'min30',
      value: t('min30'),
    },
    {
      key: 'h1',
      value: t('h1'),
    },
    {
      key: 'h2',
      value: t('h2'),
    },
    {
      key: 'h6',
      value: t('h6'),
    },
    {
      key: 'h12',
      value: t('h12'),
    },
    {
      key: 'daily',
      value: t('daily'),
    },
  ]

  const chapterOptions = [
    {
      key: 'never',
      value: t('never'),
    },
    {
      key: 'asTask',
      value: t('asTask'),
    },
    {
      key: 'asTaskAndFileUpdate',
      value: t('asTaskAndFileUpdate'),
    },
  ]

  const [autoScan, setAutoScan] = useState<boolean>(
    (serverSettings['autoScan'] as boolean) ?? false,
  )
  const [autoScanPeriod, setAutoScanPeriod] = useState<string>(
    scanOptions.find(
      (option) => option.key === serverSettings['autoScanPeriod'],
    )?.value || scanOptions[0].value,
  )
  const [generateChapters, setGenerateThumbnails] = useState<string>(
    chapterOptions.find(
      (option) => option.key === serverSettings['generateChapters'],
    )?.value || chapterOptions[0].value,
  )

  const handleAutoScanChange = (checked: boolean) => {
    setAutoScan(checked)
    setIsDirty(true)
  }

  const handleAutoScanPeriodChange = (key: string) => {
    setAutoScanPeriod(key)
    setIsDirty(true)
  }

  const handleGenerateThumbnailsChange = (key: string) => {
    setGenerateThumbnails(key)
    setIsDirty(true)
  }

  const handleSave = () => {
    setServerSetting(serverIP, 'autoScan', autoScan)
    setServerSetting(serverIP, 'autoScanPeriod', autoScanPeriod)
    setServerSetting(serverIP, 'generateChapters', generateChapters)

    setServerSettings({
      ...serverSettings,
      autoScan: autoScan,
      autoScanPeriod: autoScanPeriod,
      generateChapters: generateChapters,
    })

    setIsDirty(false)

    setShowMessage(true)

    setTimeout(() => {
      setShowMessage(false)
    }, 2000)
  }

  return (
    <ContentWrapper group={t('server')} section={t('libraries')}>
      <LabeledInputWrapper
        direction="row"
        label={t('autoScan')}
        //text={t('autoScanMessage')}
      >
        <Checkbox checked={autoScan} onCheckedChange={handleAutoScanChange} />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('scanOptions')}>
        <SelectableWrapper
          options={scanOptions}
          defaultValue={autoScanPeriod}
          onValueChange={handleAutoScanPeriodChange}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper direction="row" label={t('generateThumbnailsCheck')}>
        <SelectableWrapper
          options={chapterOptions}
          defaultValue={generateChapters}
          onValueChange={handleGenerateThumbnailsChange}
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

export default ServerLibraries
