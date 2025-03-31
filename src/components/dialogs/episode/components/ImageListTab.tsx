import FlexBox from '@/components/ui/FlexBox'
import React from 'react'

interface ImageListTabProps {
  imagesList: string[]
  localFolder: string
  selectImage: (image: string) => void
  close: () => void
  handleAccept: () => void
}

function ImageListTab({
  imagesList,
  localFolder,
  selectImage,
  close,
  handleAccept,
}: ImageListTabProps) {
  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={'25rem'}
      width={'30rem'}
    >
      <span></span>
    </FlexBox>
  )
}

export default ImageListTab
