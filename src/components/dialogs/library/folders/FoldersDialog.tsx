import { ModalWrapper } from '@/components/ModalWrapper'
import React from 'react'
import { useTranslation } from 'react-i18next'
import FoldersDialogContent from './FoldersDialogContent'

interface FoldersDialogProps {
  setFolders: (folders: string[]) => void
  trigger: React.ReactNode
}

function FoldersDialog({ trigger, setFolders }: FoldersDialogProps) {
  const { t } = useTranslation()

  return (
    <ModalWrapper
      title={t('folders')}
      tabs={[
        {
          title: '',
          content: <FoldersDialogContent setFolders={setFolders} />,
        },
      ]}
      button={trigger}
    />
  )
}

export default FoldersDialog
