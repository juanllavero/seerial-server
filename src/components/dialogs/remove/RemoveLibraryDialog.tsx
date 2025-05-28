import AlertWrapper from '@/components/AlertWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { mutate } from 'swr'

function RemoveLibraryDialog() {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { removeLibraryDialog, closeRemoveLibraryDialog } = useDialogStore()
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

        navigate({ to: '/' })
        closeRemoveLibraryDialog()
      }}
      isDeleteAlert
      closeDialog={closeRemoveLibraryDialog}
    />
  )
}

export default RemoveLibraryDialog
