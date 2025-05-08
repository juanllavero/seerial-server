import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import { Cast } from '@/data/interfaces/Media'
import React from 'react'

interface CastCardProps {
  index: number
  person: Cast
}

function CastCard({ index, person }: CastCardProps) {
  return (
    <FlexBox
      direction="column"
      gap={0.5}
      justify="center"
      align="center"
      className="text-center"
      key={'Cast Person ' + index}
      padding="1rem"
    >
      <LazyImage
        src={person.profileImage}
        width={150}
        height={150}
        className="rounded-full"
        rounded
        alt={person.name}
      />
      <span>{person.name}</span>
      <span className="text-sm" style={{ color: 'lightgray' }}>
        {person.character}
      </span>
    </FlexBox>
  )
}

export default CastCard
