import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import { useTranslation } from 'react-i18next'
import LockInput from '../../components/LockInput'

interface SeriesInfoTabProps {
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
  orderLock: boolean
  setOrderLock: (orderLock: boolean) => void
  studios: string[]
  setStudios: (studios: string[]) => void
  studiosLock: boolean
  setStudiosLock: (studiosLock: boolean) => void
  tagline: string
  setTagline: (tagline: string) => void
  taglineLock: boolean
  setTaglineLock: (taglineLock: boolean) => void
  order: string
  setOrder: (order: string) => void
}

function SeriesInfoTab({
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
  orderLock,
  setOrderLock,
  studios,
  setStudios,
  studiosLock,
  setStudiosLock,
  tagline,
  setTagline,
  taglineLock,
  setTaglineLock,
  order,
  setOrder,
}: SeriesInfoTabProps) {
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

        <LabeledInputWrapper label={t('order')}>
          <LockInput
            lock={orderLock}
            setLock={setOrderLock}
            value={order}
            setValue={setOrder}
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
          isTextArea
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default SeriesInfoTab
