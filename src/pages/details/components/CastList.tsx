import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import React from 'react'
import { useTranslation } from 'react-i18next'
import CastCard from './CastCard'

function CastList() {
  const { t } = useTranslation()
  const { selectedLibrary, selectedSeries, selectedSeason } = useDataStore()

  return (
    <FlexBox direction="column" gap={1}>
      <span>{t('cast')}</span>
      <FlexBox gap={0.5} scroll="horizontal" hideScrollbar width={'94dvw'}>
        {selectedLibrary && selectedLibrary.type === 'Movies' ? (
          <>
            {selectedSeason &&
              selectedSeason.cast &&
              selectedSeason.cast.map((person, index) => (
                <CastCard index={index} person={person} />
              ))}
          </>
        ) : (
          <>
            {selectedSeries &&
              selectedSeries.cast &&
              selectedSeries.cast.map((person, index) => (
                <CastCard index={index} person={person} />
              ))}
          </>
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default CastList
