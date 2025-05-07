import AlertWrapper from '@/components/AlertWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import { useTranslation } from 'react-i18next'

function RemoveLibraryDialog() {
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { connectWS } = useWebSocketStore()
  const { removeLibraryDialog, closeRemoveLibraryDialog } = useDialogStore()
  const navigate = useNavigate()
  return (
    <AlertWrapper
      openDialog={removeLibraryDialog.isOpen}
      title={t('removeLibrary')}
      description={t('removeLibraryMessage')}
      actionMessage={t('removeButton')}
      action={() => {
        connectWS(serverIP)
        fetch(
          `http://${serverIP}/libraries/${removeLibraryDialog.libraryToRemove?.id}`,
          {
            method: 'DELETE',
          },
        )
        //deleteLibrary(removeLibraryDialog.libraryToRemove?.id || '')
        navigate({ to: '/' })
        closeRemoveLibraryDialog()
      }}
      isDeleteAlert
      closeDialog={closeRemoveLibraryDialog}
    />
  )
}

export default RemoveLibraryDialog
