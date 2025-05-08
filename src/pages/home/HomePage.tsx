import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function HomePage() {
  const { t } = useTranslation()
  const { selectLibrary } = useDataStore()

  useEffect(() => {
    selectLibrary(null)
  }, [])

  return (
    <FlexBox
      direction="column"
      gap={1}
      padding="7rem 2rem 2rem 2rem"
      scroll="vertical"
      height="100%"
    >
      <h1></h1>
      {/* Continue Watching */}
      {/* <HorizontalList title={t('continueWatching')}>
        {libraries &&
          libraries[0] &&
          libraries[0].series.map((series) => (
            <Card
              itemKey={'Home Card' + series.id}
              imgSrc={series.seasons && series.seasons[0]?.backgroundSrc}
              aspectRatio={16 / 9}
              width={380}
              title={series.name}
              subtitle={series.year}
              action={function (): void {}}
            />
          ))}
        {libraries &&
          libraries[0] &&
          libraries[0].series.map((series) => (
            <Card
              itemKey={'Home Card' + series.id}
              imgSrc={series.seasons && series.seasons[0]?.backgroundSrc}
              aspectRatio={16 / 9}
              width={380}
              title={series.name}
              subtitle={series.year}
              action={function (): void {}}
            />
          ))}
      </HorizontalList> */}

      {/* User WatchList */}
      {/* <HorizontalList title={t('watchList')}>
        {libraries &&
          libraries[0] &&
          libraries[0].series.map((series) => (
            <Card
              itemKey={'Home Card' + series.id}
              imgSrc={
                libraries[0].type === 'Movies' &&
                !series.isCollection &&
                series.seasons &&
                series.seasons.length > 0
                  ? series.seasons[0].coverSrc
                  : series.coverSrc
              }
              width={180}
              aspectRatio={libraries[0].type === 'Music' ? 1 : 2 / 3}
              title={series.name}
              subtitle={series.year}
              action={function (): void {}}
            />
          ))}
        {libraries &&
          libraries[0] &&
          libraries[0].series.map((series) => (
            <Card
              itemKey={'Home Card' + series.id}
              imgSrc={
                libraries[0].type === 'Movies' &&
                !series.isCollection &&
                series.seasons &&
                series.seasons.length > 0
                  ? series.seasons[0].coverSrc
                  : series.coverSrc
              }
              width={180}
              aspectRatio={libraries[0].type === 'Music' ? 1 : 2 / 3}
              title={series.name}
              subtitle={series.year}
              action={function (): void {}}
            />
          ))}
      </HorizontalList> */}
    </FlexBox>
  )
}
