import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import { useTranslation } from 'react-i18next'
import LockInput from '../../components/LockInput'

interface MovieInfoTabProps {
  name: string
  setName: (name: string) => void
  year: string
  setYear: (year: string) => void
  overview: string
  setOverview: (overview: string) => void
  nameLock: boolean
  yearLock: boolean
  overviewLock: boolean
  setNameLock: (nameLock: boolean) => void
  setYearLock: (yearLock: boolean) => void
  setOverviewLock: (overviewLock: boolean) => void
  studios: string[]
  setStudios: (studios: string[]) => void
  studiosLock: boolean
  setStudiosLock: (studiosLock: boolean) => void
  tagline: string
  setTagline: (tagline: string) => void
  taglineLock: boolean
  setTaglineLock: (taglineLock: boolean) => void
}

function MovieInfoTab({
  name,
  setName,
  year,
  setYear,
  overview,
  setOverview,
  nameLock,
  yearLock,
  overviewLock,
  setNameLock,
  setYearLock,
  setOverviewLock,
  studios,
  setStudios,
  studiosLock,
  setStudiosLock,
  tagline,
  setTagline,
  taglineLock,
  setTaglineLock,
}: MovieInfoTabProps) {
  const { t } = useTranslation()
  const isTablet = useIsTablet()

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

      <LabeledInputWrapper label={t('studios')}>
        <LockInput
          lock={studiosLock}
          setLock={setStudiosLock}
          values={studios}
          setValues={setStudios}
          placeholder={`${t('studios')}...`}
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('tagline')}>
        <LockInput
          lock={taglineLock}
          setLock={setTaglineLock}
          value={tagline}
          setValue={setTagline}
        />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('overview')}>
        <LockInput
          lock={overviewLock}
          setLock={setOverviewLock}
          value={overview}
          setValue={setOverview}
          type="textarea"
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default MovieInfoTab
