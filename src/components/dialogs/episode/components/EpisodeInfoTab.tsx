import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import TagInput from '@/components/ui/tags-input'
import { t } from 'i18next'
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
}: EpisodeInfoTabProps) {
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()
  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="start"
      align="center"
      height={isTablet ? '25rem' : '35rem'}
      hideScrollbar={isTablet}
      scroll="vertical"
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
          type="textarea"
        />
      </LabeledInputWrapper>

      <FlexBox
        direction="row"
        wrap={isMobile ? 'wrap' : 'nowrap'}
        justify="center"
        align="center"
        width={'100%'}
        gap={1}
      >
        <LabeledInputWrapper label={t('directedBy')}>
          <TagInput
            value={directedBy}
            onChange={setDirectedBy}
            width="w-full"
          />
        </LabeledInputWrapper>

        <LabeledInputWrapper label={t('writtenBy')}>
          <TagInput value={writtenBy} onChange={setWrittenBy} width="w-full" />
        </LabeledInputWrapper>
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeInfoTab
