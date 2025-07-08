import AlertWrapper from '@/components/AlertWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { mutate } from 'swr'
import { shallow } from 'zustand/shallow'

function RemoveLibraryDialog() {
  const { t } = useTranslation()
  const serverIP = useServerStore((state) => state.serverIP)
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
        if (serverIP === '') return

        connectWS(serverIP)
        await fetch(
          `http://${serverIP}/libraries/${removeLibraryDialog.libraryToRemove}`,
          {
            method: 'DELETE',
          },
        )

        // Mutate libraries list
        mutate((key: string) => key.startsWith(`http://${serverIP}/libraries`))

        navigate('/home')
        closeRemoveLibraryDialog()
      }}
      isDeleteAlert
      closeDialog={closeRemoveLibraryDialog}
    />
  )
}

export default RemoveLibraryDialog
