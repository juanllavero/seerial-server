import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import React from 'react'
import { useTranslation } from 'react-i18next'
import LockInput from '../../components/LockInput'

interface SeasonInfoTabProps {
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
  order: string
  setOrder: (order: string) => void
}

function SeasonInfoTab({
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
  order,
  setOrder,
}: SeasonInfoTabProps) {
  const { t } = useTranslation()
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

export default SeasonInfoTab
