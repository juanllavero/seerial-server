import AlertWrapper from '@/components/AlertWrapper'
import { authenticatedFetch } from '@/config/api'
import { useDialogStore } from '@/context/dialog.context'
import { useWebSocketStore } from '@/context/ws.context'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { mutate } from 'swr'
import { shallow } from 'zustand/shallow'

function RemoveLibraryDialog() {
  const { t } = useTranslation()
  const connectWS = useWebSocketStore((state) => state.connectWS)
  const { removeLibraryDialog, closeRemoveLibraryDialog } = useDialogStore(
    (state) => ({
      removeLibraryDialog: state.removeLibraryDialog,
      closeRemoveLibraryDialog: state.closeRemoveLibraryDialog,
    }),
    shallow,
  )
  const navigate = useNavigate()
  return (
    <AlertWrapper
      openDialog={removeLibraryDialog.isOpen}
      title={t('removeLibrary')}
      description={t('removeLibraryMessage')}
      actionMessage={t('removeButton')}
      action={async () => {
        connectWS()
        await authenticatedFetch(
          `/api/libraries/${removeLibraryDialog.libraryToRemove}`,
          'DELETE',
        )

        // Mutate libraries list
        mutate((key: string) => key.startsWith(`/api/libraries`))

        navigate('/home')
        closeRemoveLibraryDialog()
      }}
      isDeleteAlert
      closeDialog={closeRemoveLibraryDialog}
    />
  )
}

export default RemoveLibraryDialog
