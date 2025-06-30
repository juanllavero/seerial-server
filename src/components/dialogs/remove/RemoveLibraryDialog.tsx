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
  const selectedServer = useServerStore((state) => state.selectedServer)
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
        if (!selectedServer) return

        const serverIP = selectedServer.ip
        connectWS(serverIP)
        await fetch(
          `https://${serverIP}/libraries/${removeLibraryDialog.libraryToRemove}`,
          {
            method: 'DELETE',
          },
        )

        // Mutate libraries list
        mutate((key: string) => key.startsWith(`https://${serverIP}/libraries`))

        navigate('/home')
        closeRemoveLibraryDialog()
      }}
      isDeleteAlert
      closeDialog={closeRemoveLibraryDialog}
    />
  )
}

export default RemoveLibraryDialog
