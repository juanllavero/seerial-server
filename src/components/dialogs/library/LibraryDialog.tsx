import { useDialogStore } from '@/context/dialog.context'
import { Library } from '@/data/interfaces/Media'
import React, { useState } from 'react'
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

  // Form Data
  const [type, setType] = useState<string | undefined>()
  const [name, setName] = useState<string>('')
  const [language, setLanguage] = useState<string | undefined>()
  const [folders, setFolders] = useState<string[]>()
  const [preferAudioLan, setPreferAudioLan] = useState<string | undefined>()
  const [preferSubLan, setPreferSubLan] = useState<string | undefined>()
  const [subsMode, setSubsMode] = useState<string | undefined>()

  const openDialog = () => {
    openLibraryDialog(library)
  }

  return (
    <ModalWrapper
      title={library ? t('libraryWindowTitleEdit') : t('libraryWindowTitle')}
      tabs={[
        {
          title: t('generalButton'),
          content: <GeneralTabContent type={type} setType={setType} name={name} setName={setName} setLanguage={setLanguage} />,
        },
        {
          title: t('folders'),
          content: <FoldersTabContent folders={folders ?? []} setFolders={setFolders} />,
        },
        {
          title: t('details'),
          content: <AdvancedTabContent
            preferAudioLan={preferAudioLan}
            setPreferAudioLan={setPreferAudioLan}
            preferSubLan={preferSubLan}
            setPreferSubLan={setPreferSubLan}
            subsMode={subsMode}
            setSubsMode={setSubsMode}
          />,
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
