import { X } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'

interface FolderButtonProps {
  index: number
  folder: string
  removeFolder: (folder: string) => void
}

function FolderButton({ index, folder, removeFolder }: FolderButtonProps) {
  return (
    <FlexBox
      key={'Folder ' + index}
      gap={1}
      width={'100%'}
      align="center"
      justify="space-between"
      padding="0.2rem 0.5rem"
      css={{ backgroundColor: '#595959', borderRadius: '5px' }}
    >
      <span className="mr-2 ml-1">{folder}</span>
      <Button variant={'ghost'} size={'icon'} onClick={() => removeFolder(folder)}>
        <X />
      </Button>
    </FlexBox>
  )
}

export default FolderButton
