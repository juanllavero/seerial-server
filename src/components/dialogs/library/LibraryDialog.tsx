import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { authenticatedFetch } from '@/lib/auth'
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
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const currentLanguage = i18n.language?.split('-')[0] ?? 'en'
  const { server, serverUrl } = useServerStore(
    (state) => ({
      server: state.server,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
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
  const [preferAudioLan, setPreferAudioLan] = useState<string>(currentLanguage)
  const [preferSubLan, setPreferSubLan] = useState<string>(currentLanguage)
  const [subsMode, setSubsMode] = useState<string>('autoSubs')

  useEffect(() => {
    if (libraryDialog && !libraryDialog.libraryToEdit) {
      setType(undefined)
      setName('')
      setLanguage(undefined)
      setFolders(undefined)
      setPreferAudioLan(currentLanguage)
      setPreferSubLan(currentLanguage)
      setSubsMode('autoSubs')
      setSelectedTab(t('generalButton'))
    } else if (libraryDialog && libraryDialog.libraryToEdit) {
      setType(libraryDialog.libraryToEdit.type)
      setName(libraryDialog.libraryToEdit.name)
      setLanguage(libraryDialog.libraryToEdit.language)
      setFolders(libraryDialog.libraryToEdit.folders)
      setPreferAudioLan(
        libraryDialog.libraryToEdit.preferAudioLan ?? currentLanguage,
      )
      setPreferSubLan(
        libraryDialog.libraryToEdit.preferSubLan ?? currentLanguage,
      )
      setSubsMode(libraryDialog.libraryToEdit.subsMode ?? 'autoSubs')
      setSelectedTab(t('generalButton'))
    }
  }, [libraryDialog])

  const handleAddEditLibrary = async () => {
    if (serverUrl === '') return

    setLoading(true)

    await connectWS(serverUrl)

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

      await authenticatedFetch(`${serverUrl}/library`, 'PUT', {
        libraryId: libraryDialog.libraryToEdit.id,
        updatedLibrary: newLibrary,
      })

      // Mutate libraries list
      mutate((key: string) => key.startsWith(`${serverUrl}/libraries`))

      closeLibraryDialog()

      setLoading(false)
      return
    }

    const newLibrary = {
      name,
      language: language ?? 'en',
      type: type ?? 'Shows',
      order: 0,
      hidden: false,
      serverId: server?.id ?? '1',
      folders: folders ?? [],
      backgroundSrc: '',
      preferAudioLan,
      preferSubLan,
      subsMode,
    }

    const response = await authenticatedFetch(
      `${serverUrl}/addLibrary`,
      'POST',
      newLibrary,
    )

    closeLibraryDialog()

    if (!response || !response.ok) {
      setLoading(false)
      return
    }

    // Mutate libraries list
    mutate((key: string) => key.startsWith(`${serverUrl}/libraries`))

    console.log({ okay: response.ok, response })
    const data = await response.json()
    console.log({ data })
    const libraryId = data.id

    setLoading(false)

    // Navigate to new library page
    navigate(`/library/${libraryId}/${type ?? 'Shows'}`)
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
