import { API } from '@/config/api'
import { useDialogStore } from '@/context/dialog.store'
import { useWebSocketStore } from '@/context/ws.context'
import { Library } from '@/data/interfaces/Media'
import { useCreate } from '@/hooks/media/useCreateContent'
import { useGet } from '@/hooks/media/useGet'
import { useUpdate } from '@/hooks/media/useUpdate'
import useFormState from '@/hooks/useFormState'
import { showToast } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ModalWrapper } from '../../ModalWrapper'
import AdvancedTabContent from './AdvancedTabContent'
import FoldersTabContent from './FoldersTabContent'
import GeneralTabContent from './GeneralTabContent'

interface LibraryFormState {
  type: string | undefined
  name: string
  language: string | undefined
  folders: string[]
  preferAudioLan: string
  preferSubLan: string
  subsMode: string
}

function LibraryDialog() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const currentLanguage = i18n.language?.split('-')[0] ?? 'en'
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { error: updateError, update } = useUpdate<Library>()
  const { error: createError, create } = useCreate<Library>()
  const { payload, closeDialog } = useDialogStore()
  const { id } = payload as { id?: string }

  // Fetch Data
  const { data: library } = useGet<Library>(
    id ? API.libraries.getById(id) : null,
  )

  // State Management
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedTab, setSelectedTab] = useState<string | undefined>()

  // Form Data Management
  const form = useFormState<LibraryFormState>(
    {
      type: undefined,
      name: '',
      language: undefined,
      folders: [],
      preferAudioLan: currentLanguage,
      preferSubLan: currentLanguage,
      subsMode: 'autoSubs',
    },
    {
      preferAudioLan: currentLanguage,
      preferSubLan: currentLanguage,
    },
  )

  // Initialization
  useEffect(() => {
    if (!library && id) return

    if (!id) {
      // Adding new library
      form.resetFormState({
        type: undefined,
        name: '',
        language: undefined,
        folders: [],
        preferAudioLan: currentLanguage,
        preferSubLan: currentLanguage,
        subsMode: 'autoSubs',
      })
      setSelectedTab(t('generalButton'))
    } else if (library) {
      // Editing existing library
      form.resetFormState({
        type: library.type,
        name: library.name,
        language: library.language,
        folders: library.folders,
        preferAudioLan: library.preferAudioLan ?? currentLanguage,
        preferSubLan: library.preferSubLan ?? currentLanguage,
        subsMode: library.subsMode ?? 'autoSubs',
      })
      setSelectedTab(t('generalButton'))
    }
  }, [library, id, currentLanguage, t, form])

  const handleAddEditLibrary = async () => {
    setLoading(true)
    await connectWS()

    const libraryData = {
      name: form.name,
      language: form.language ?? 'en',
      type: form.type ?? 'Shows',
      folders: form.folders ?? [],
      preferAudioLan: form.preferAudioLan,
      preferSubLan: form.preferSubLan,
      subsMode: form.subsMode,
    }

    if (id) {
      const updatedLibrary = await update(API.libraries.update(id), libraryData)

      if (updateError || !updatedLibrary) {
        showToast('error', t('libraryUpdateError'))
        setLoading(false)
        return
      }

      closeDialog()
    } else {
      const newLibrary = await create(API.libraries.create, libraryData)

      if (createError || !newLibrary) {
        showToast('error', t('libraryCreateError'))
        setLoading(false)
        return
      }

      closeDialog()
      navigate(`/library/${newLibrary.id}/${libraryData.type}`)
    }

    setLoading(false)
  }

  const handleSaveOrNext = () => {
    if (id) {
      handleAddEditLibrary()
    } else {
      setSelectedTab(t('folders'))
    }
  }

  const isOpen = !!id

  return (
    <ModalWrapper
      title={id ? t('libraryWindowTitleEdit') : t('libraryWindowTitle')}
      tabs={[
        {
          title: t('generalButton'),
          content: (
            <GeneralTabContent
              type={form.type}
              setType={form.setType}
              name={form.name}
              disableButton={loading}
              setName={form.setName}
              setLanguage={form.setLanguage}
              onSave={handleSaveOrNext}
              close={closeDialog}
              edit={id !== undefined}
            />
          ),
        },
        {
          title: t('folders'),
          disabled: !form.type,
          content: (
            <FoldersTabContent
              folders={form.folders ?? []}
              setFolders={form.setFolders}
              close={closeDialog}
              handleAddLibrary={handleAddEditLibrary}
              buttonDisabled={
                !form.folders || form.folders.length === 0 || loading
              }
              edit={id !== undefined}
            />
          ),
        },
        {
          title: t('details'),
          disabled: !form.folders || form.folders.length === 0,
          content: (
            <AdvancedTabContent
              preferAudioLan={form.preferAudioLan}
              setPreferAudioLan={form.setPreferAudioLan}
              preferSubLan={form.preferSubLan}
              setPreferSubLan={form.setPreferSubLan}
              subsMode={form.subsMode}
              setSubsMode={form.setSubsMode}
              close={closeDialog}
              buttonDisabled={
                !form.folders || form.folders.length === 0 || loading
              }
              handleAddLibrary={handleAddEditLibrary}
              edit={id !== undefined}
            />
          ),
        },
      ]}
      isOpen={isOpen}
      close={closeDialog}
      hideButtons
      activeTab={selectedTab}
      onTabChange={(newTab) => setSelectedTab(newTab)}
    />
  )
}

export default LibraryDialog
