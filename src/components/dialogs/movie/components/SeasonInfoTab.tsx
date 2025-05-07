import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import TagInput from '@/components/ui/tags-input'
import useDataStore from '@/context/data.context'
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
  genres: string[]
  setGenres: (genres: string[]) => void
  genresLock: boolean
  setGenresLock: (genresLock: boolean) => void
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
  studios,
  setStudios,
  studiosLock,
  setStudiosLock,
  genres,
  setGenres,
  genresLock,
  setGenresLock,
  tagline,
  setTagline,
  taglineLock,
  setTaglineLock,
  order,
  setOrder,
}: SeasonInfoTabProps) {
  const { t } = useTranslation()
  const isTablet = useIsTablet()
  const { selectedLibrary } = useDataStore()

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

      {selectedLibrary?.type === 'Movies' && (
        <>
          <LabeledInputWrapper label={t('studios')}>
            <TagInput
              value={studios}
              onChange={setStudios}
              placeholder="Añadir estudio..."
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
        </>
      )}

      {selectedLibrary?.type === 'Music' && (
        <LabeledInputWrapper label={t('genres')}>
          <TagInput
            value={genres}
            onChange={setGenres}
            placeholder="Añadir género..."
          />
        </LabeledInputWrapper>
      )}

      {selectedLibrary?.type !== 'Music' && (
        <LabeledInputWrapper label={t('overview')}>
          <LockInput
            lock={overviewLock}
            setLock={setOverviewLock}
            value={overview}
            setValue={setOverview}
            isTextArea
          />
        </LabeledInputWrapper>
      )}
    </FlexBox>
  )
}

export default SeasonInfoTab
