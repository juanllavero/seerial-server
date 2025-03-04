import React from 'react'
import useDataStore from '@/context/data.context'
import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import HorizontalList from './components/HorizontalList'
import Card from '@/components/cards/Card'

export default function HomePage() {
  const { loadingLibraries, libraries } = useDataStore()

  if (loadingLibraries) {
    return <Loading />
  }

  return (
    <FlexBox direction="column" gap={2} padding="8rem 2rem 2rem 2rem">
      <HorizontalList title="Title test">
        {libraries &&
          libraries[1] &&
          libraries[1].series.map((series) => (
            <Card
              itemKey={'Home Card' + series.id}
              imgSrc={series.coverSrc}
              aspectRatio={2 / 3}
              width={300}
              title={series.name}
              subtitle={series.year}
              action={function (): void {
                throw new Error('Function not implemented.')
              }}
            />
          ))}
      </HorizontalList>
    </FlexBox>
  )
}
