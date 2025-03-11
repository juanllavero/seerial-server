import FlexBox from '@/components/ui/FlexBox'
import React from 'react'
import { useTranslation } from 'react-i18next'

function ServerTranscode() {
  const { t } = useTranslation()

  return (
    <FlexBox direction="column" gap={1.5}>
      <span className="mb-4 text-3xl font-bold">
        {t('server')} - {t('transcode')}
      </span>
    </FlexBox>
  )
}

export default ServerTranscode
