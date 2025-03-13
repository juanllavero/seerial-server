import { useDialogStore } from '@/context/dialog.context'
import { Library } from '@/data/interfaces/Media'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ModalWrapper } from '../../ModalWrapper'
import AdvancedTabContent from './AdvancedTabContent'
import FoldersTabContent from './FoldersTabContent'
import GeneralTabContent from './GeneralTabContent'

interface LibraryDialogProps {
  library?: Library
}

function LibraryDialog({ library }: LibraryDialogProps) {
  const { t } = useTranslation()
  const { libraryDialog, closeLibraryDialog, openLibraryDialog } =
    useDialogStore()

  const openDialog = () => {
    openLibraryDialog(library)
  }

  return (
    <ModalWrapper
      title={library ? t('libraryWindowTitleEdit') : t('libraryWindowTitle')}
      tabs={[
        {
          title: t('generalButton'),
          content: <GeneralTabContent />,
        },
        {
          title: t('folders'),
          content: <FoldersTabContent />,
        },
        {
          title: t('details'),
          content: <AdvancedTabContent />,
        },
      ]}
      isOpen={libraryDialog.isOpen}
      openDialog={openDialog}
      close={closeLibraryDialog}
      hideButtons
    />
  )
}

export default LibraryDialog
