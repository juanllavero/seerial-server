import React from 'react'
import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import { useNavigate } from '@tanstack/react-router'
import CollectionCard from './components/CollectionCard'

function CollectionPage() {
  const { selectedLibrary } = useDataStore()
  const navigate = useNavigate()

  if (!selectedLibrary) {
    navigate({ to: '/' })
    return null
  }

  return (
    <FlexBox gap={1} wrap="wrap" padding="2rem">
      {selectedLibrary.series.map((series) => (
        <CollectionCard series={series} key={series.id} />
      ))}
    </FlexBox>
  )
}

export default CollectionPage
