import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import { ModalWrapper } from '../../ModalWrapper'
import AdvancedTabContent from './AdvancedTabContent'
import FoldersTabContent from './FoldersTabContent'
import GeneralTabContent from './GeneralTabContent'

function LibraryDialog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const serverIP = useServerStore((state) => state.serverIP)
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { libraryDialog, closeLibraryDialog } = useDialogStore(
    (state) => ({
      libraryDialog: state.libraryDialog,
      closeLibraryDialog: state.closeLibraryDialog,
    }),
    shallow,
  )
  const [loading, setLoading] = useState<boolean>(false)
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
    if (libraryDialog && !libraryDialog.libraryToEdit) {
      setType(undefined)
      setName('')
      setLanguage(undefined)
      setFolders(undefined)
      setPreferAudioLan(undefined)
      setPreferSubLan(undefined)
      setSubsMode(undefined)
      setSelectedTab(t('generalButton'))
    } else if (libraryDialog && libraryDialog.libraryToEdit) {
      setType(libraryDialog.libraryToEdit.type)
      setName(libraryDialog.libraryToEdit.name)
      setLanguage(libraryDialog.libraryToEdit.language)
      setFolders(libraryDialog.libraryToEdit.folders)
      setPreferAudioLan(libraryDialog.libraryToEdit.preferAudioLan)
      setPreferSubLan(libraryDialog.libraryToEdit.preferSubLan)
      setSubsMode(libraryDialog.libraryToEdit.subsMode)
      setSelectedTab(t('generalButton'))
    }
  }, [libraryDialog])

  const handleAddEditLibrary = async () => {
    if (serverIP === '') return

    setLoading(true)

    await connectWS(serverIP)

    if (libraryDialog.libraryToEdit) {
      const newLibrary = {
        id: libraryDialog.libraryToEdit.id,
        name,
        language: language ?? 'en',
        type: type ?? 'Shows',
        order: 0,
        folders: folders ?? [],
        preferAudioLan,
        preferSubLan,
        subsMode,
      }

      await fetch(`http://${serverIP}/library`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          libraryId: libraryDialog.libraryToEdit.id,
          updatedLibrary: newLibrary,
        }),
      })

      // Mutate libraries list
      mutate((key: string) => key.startsWith(`http://${serverIP}/libraries`))

      closeLibraryDialog()

      setLoading(false)
      return
    }

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

    if (!response.ok) {
      setLoading(false)
      return
    }

    // Mutate libraries list
    mutate((key: string) => key.startsWith(`http://${serverIP}/libraries`))

    const data = await response.json()
    const libraryId = data.id

    setLoading(false)

    // Navigate to new library page
    navigate(`/server/${serverIP}/library/${libraryId}/${type ?? 'Shows'}`)
  }

  const handleSaveOrNext = () => {
    if (libraryDialog.libraryToEdit) {
      handleAddEditLibrary()
    } else {
      setSelectedTab(t('folders'))
    }
  }

  return (
    <ModalWrapper
      title={
        libraryDialog.libraryToEdit
          ? t('libraryWindowTitleEdit')
          : t('libraryWindowTitle')
      }
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <GeneralTabContent
              type={type}
              setType={setType}
              name={name}
              disableButton={loading}
              setName={setName}
              setLanguage={setLanguage}
              onSave={handleSaveOrNext}
              close={closeLibraryDialog}
              edit={libraryDialog.libraryToEdit !== undefined}
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
              buttonDisabled={!folders || folders.length === 0 || loading}
              edit={libraryDialog.libraryToEdit !== undefined}
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
              buttonDisabled={!folders || folders.length === 0 || loading}
              handleAddLibrary={handleAddEditLibrary}
              edit={libraryDialog.libraryToEdit !== undefined}
            />
          ),
        },
      ]}
      width={'30rem'}
      isOpen={libraryDialog.isOpen}
      close={closeLibraryDialog}
      hideButtons
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default LibraryDialog
