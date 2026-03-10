import React from 'react'
import { useTranslation } from 'react-i18next'
import { ModalWrapper } from '@/components/ModalWrapper'
import FoldersDialogContent from './FoldersDialogContent'

interface FoldersDialogProps {
  folders: string[]
  setFolders: (folders: string[]) => void
  isOpen: boolean
  close: () => void
}

function FoldersDialog({ folders, setFolders, isOpen, close }: FoldersDialogProps) {
  const { t } = useTranslation()

  return (
    <ModalWrapper
      title={t('folders')}
      tabs={[
        {
          title: '',
          content: <FoldersDialogContent folders={folders} setFolders={setFolders} close={close} />,
        },
      ]}
      isOpen={isOpen}
      close={close}
      hideButtons
    />
  )
}

export default FoldersDialog
