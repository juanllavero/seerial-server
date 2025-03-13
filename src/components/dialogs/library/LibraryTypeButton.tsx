import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Film, Music, TvMinimal } from 'lucide-react'
import React from 'react'

interface LibraryTypeButtonProps {
  selectedType: string | undefined
  type: 'Movies' | 'Shows' | 'Music'
  onClick: () => void
}

function LibraryTypeButton({
  selectedType,
  type,
  onClick,
}: LibraryTypeButtonProps) {
  return (
    <Button
      variant={'ghost'}
      className="h-fit w-40"
      onClick={onClick}
      style={{ color: selectedType === type ? 'var(--app-color)' : '' }}
    >
      <FlexBox
        direction="column"
        gap={1}
        justify="center"
        align="center"
        padding="1rem"
      >
        {type === 'Movies' ? (
          <Film size={'2rem'} />
        ) : type === 'Shows' ? (
          <TvMinimal size={'2rem'} />
        ) : (
          <Music size={'2rem'} />
        )}
        <span
          className="font-semibold"
          style={{ color: selectedType === type ? 'var(--app-color)' : '' }}
        >
          {type}
        </span>
      </FlexBox>
    </Button>
  )
}

export default LibraryTypeButton
