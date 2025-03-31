import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { t } from 'i18next'
import React from 'react'

interface EpisodeInfoTabProps {
  name: string
  setName: (name: string) => void
  year: string
  setYear: (year: string) => void
  overview: string
  setOverview: (overview: string) => void
  directedBy: string[]
  setDirectedBy: (directedBy: string[]) => void
  writtenBy: string[]
  setWrittenBy: (writtenBy: string[]) => void
  nameLock: boolean
  yearLock: boolean
  overviewLock: boolean
  directedLock: boolean
  writtenLock: boolean
  selectTab: (tab: string | undefined) => void
  close: () => void
}

function EpisodeInfoTab({
  name,
  setName,
  year,
  setYear,
  overview,
  setOverview,
  directedBy,
  setDirectedBy,
  writtenBy,
  setWrittenBy,
  nameLock,
  yearLock,
  overviewLock,
  directedLock,
  writtenLock,
  selectTab,
  close,
}: EpisodeInfoTabProps) {
  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={'25rem'}
      width={'30rem'}
    >
      <LabeledInputWrapper label={t('name')}>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('year')}>
        <Input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('overview')}>
        <Input
          type="text"
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default EpisodeInfoTab
