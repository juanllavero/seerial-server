import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { Library } from '@/data/interfaces/Media'
import { useNavigate } from '@tanstack/react-router'
import React, { useEffect, useState } from 'react'
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
  const navigate = useNavigate()
  const { serverIP } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { libraryDialog, closeLibraryDialog, openLibraryDialog } =
    useDialogStore()
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  // Form Data
  const [type, setType] = useState<string | undefined>()
  const [name, setName] = useState<string>('')
  const [language, setLanguage] = useState<string | undefined>()
  const [folders, setFolders] = useState<string[]>()
  const [preferAudioLan, setPreferAudioLan] = useState<string | undefined>()
  const [preferSubLan, setPreferSubLan] = useState<string | undefined>()
  const [subsMode, setSubsMode] = useState<string | undefined>()

  useEffect(() => {
    if (libraryDialog) {
      setType(undefined)
      setName('')
      setLanguage(undefined)
      setFolders(undefined)
      setPreferAudioLan(undefined)
      setPreferSubLan(undefined)
      setSubsMode(undefined)
      setSelectedTab(t('generalButton'))
    }
  }, [libraryDialog])

  const openDialog = () => {
    openLibraryDialog(library)
  }

  const handleAddEditLibrary = async () => {
    await connectWS(serverIP)

    const newLibrary = {
      name,
      language: language ?? 'en',
      type: type ?? 'Shows',
      order: 0,
      folders: folders ?? [],
      preferAudioLan,
      preferSubLan,
      subsMode,
    }

    const response = await fetch(`http://${serverIP}/addLibrary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newLibrary),
    })

    closeLibraryDialog()

    if (!response.ok) return

    const data = await response.json()
    const libraryId = data.id

    // Navigate to new library page
    navigate({
      to: '/collection/$libraryId',
      params: { libraryId },
    })
  }

  return (
    <ModalWrapper
      title={library ? t('libraryWindowTitleEdit') : t('libraryWindowTitle')}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <GeneralTabContent
              type={type}
              setType={setType}
              name={name}
              setName={setName}
              setLanguage={setLanguage}
              selectTab={setSelectedTab}
              close={closeLibraryDialog}
            />
          ),
        },
        {
          title: t('folders'),
          disabled: !type,
          content: (
            <FoldersTabContent
              folders={folders ?? []}
              setFolders={setFolders}
              close={closeLibraryDialog}
              handleAddLibrary={handleAddEditLibrary}
              buttonDisabled={!folders || folders.length === 0}
            />
          ),
        },
        {
          title: t('details'),
          disabled: !folders || folders.length === 0,
          content: (
            <AdvancedTabContent
              preferAudioLan={preferAudioLan}
              setPreferAudioLan={setPreferAudioLan}
              preferSubLan={preferSubLan}
              setPreferSubLan={setPreferSubLan}
              subsMode={subsMode}
              setSubsMode={setSubsMode}
              close={closeLibraryDialog}
              buttonDisabled={!folders || folders.length === 0}
              handleAddLibrary={handleAddEditLibrary}
            />
          ),
        },
      ]}
      isOpen={libraryDialog.isOpen}
      openDialog={openDialog}
      close={closeLibraryDialog}
      hideButtons
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default LibraryDialog
