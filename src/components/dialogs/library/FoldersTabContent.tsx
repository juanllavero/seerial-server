import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { t } from 'i18next'
import React, { useState } from 'react'
import FolderButton from './FolderButton'
import FoldersDialog from './folders/FoldersDialog'

interface FoldersTabContentProps {
  folders: string[]
  setFolders: (folders: string[]) => void
}

function FoldersTabContent({ folders, setFolders }: FoldersTabContentProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleRemoveFolder = (folder: string) => {
    setFolders([...folders.filter((elem) => elem !== folder)])
  }

  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={'25rem'}
      width={'30rem'}
    >
      <FlexBox direction="column" gap={1} align="center" width={'100%'}>
        <span className="self-start">{t('addFolderText')}</span>
        <FlexBox direction="column" gap={0.5} width={'100%'}>
          {folders.length > 0 ? (
            folders.map((folder, index) => (
              <FolderButton
                index={index}
                folder={folder}
                removeFolder={handleRemoveFolder}
              />
            ))
          ) : (
            <></>
          )}
        </FlexBox>

        <Button onClick={() => setIsOpen(true)}>{t('addFolder')}</Button>
        <FoldersDialog
          folders={folders}
          isOpen={isOpen}
          close={() => setIsOpen(false)}
          setFolders={setFolders}
        />
      </FlexBox>

      <FlexBox width={'100%'} justify="end" gap={1}>
        <Button variant={'secondary'}>{t('cancelButton')}</Button>
        <Button>{t('next')}</Button>
      </FlexBox>
    </FlexBox>
  )
}

export default FoldersTabContent
