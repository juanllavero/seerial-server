import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import { t } from 'i18next'
import React from 'react'
import LockInput from '../../components/LockInput'

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
  setNameLock: (nameLock: boolean) => void
  setYearLock: (yearLock: boolean) => void
  setOverviewLock: (overviewLock: boolean) => void
  setDirectedLock: (directedLock: boolean) => void
  setWrittenLock: (writtenLock: boolean) => void
  selectTab: (tab: string | undefined) => void
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
  setNameLock,
  setYearLock,
  setOverviewLock,
  setDirectedLock,
  setWrittenLock,
  overviewLock,
  directedLock,
  writtenLock,
  selectTab,
}: EpisodeInfoTabProps) {
  const isTablet = useIsTablet()
  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="start"
      align="center"
      height={isTablet ? '25rem' : '35rem'}
      width={isTablet ? '100%' : '50rem'}
      hideScrollbar={isTablet}
    >
      <FlexBox gap={1} width={'100%'} direction={isTablet ? 'column' : 'row'}>
        <LabeledInputWrapper label={t('name')}>
          <LockInput
            lock={nameLock}
            setLock={setNameLock}
            value={name}
            setValue={setName}
          />
        </LabeledInputWrapper>

        <LabeledInputWrapper label={t('year')}>
          <LockInput
            lock={yearLock}
            setLock={setYearLock}
            value={year}
            setValue={setYear}
          />
        </LabeledInputWrapper>
      </FlexBox>

      <LabeledInputWrapper label={t('overview')}>
        <LockInput
          lock={overviewLock}
          setLock={setOverviewLock}
          value={overview}
          setValue={setOverview}
          isTextArea
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default EpisodeInfoTab
