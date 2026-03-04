import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { t } from 'i18next'
import { useState } from 'react'
import FolderButton from './FolderButton'
import FoldersDialog from './folders/FoldersDialog'

interface FoldersTabContentProps {
  folders: string[]
  setFolders: (folders: string[]) => void
  close: () => void
  buttonDisabled: boolean
  handleAddLibrary: () => void
  edit?: boolean
}

function FoldersTabContent({
  folders,
  setFolders,
  close,
  buttonDisabled,
  handleAddLibrary,
  edit,
}: FoldersTabContentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleRemoveFolder = (folder: string) => {
    setFolders([...folders.filter((elem) => elem !== folder)])
  }

  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={'27rem'}
      width={'100%'}
    >
      <FlexBox
        direction="column"
        gap={1}
        align={isMobile ? 'stretch' : 'center'}
        width={'100%'}
      >
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
        <Button variant={'secondary'} onClick={close}>
          {t('cancelButton')}
        </Button>
        <Button onClick={handleAddLibrary} disabled={buttonDisabled}>
          {t(edit ? 'saveButton' : 'addButton')}
        </Button>
      </FlexBox>
    </FlexBox>
  )
}

export default FoldersTabContent
