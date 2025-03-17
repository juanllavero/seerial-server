import AlertWrapper from '@/components/AlertWrapper'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useServerStore } from '@/context/server.context'
import { useNavigate } from '@tanstack/react-router'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useWebSocketStore } from '@/context/ws.context'

function RemoveLibraryDialog() {
    const { t } = useTranslation()
    const { serverIP } = useServerStore()
    const { connectWS } = useWebSocketStore()
    const { deleteLibrary } = useDataStore()
    const { removeLibraryDialog, closeRemoveLibraryDialog } = useDialogStore()
    const navigate = useNavigate()
  return (
    <AlertWrapper openDialog={removeLibraryDialog.isOpen} title={t('removeLibrary')} description={t('removeLibraryMessage')} actionMessage={t('removeButton')} action={() => {
        connectWS(serverIP)
        fetch(`https://${serverIP}/libraries/${removeLibraryDialog.libraryToRemove?.id}`, {
          method: 'DELETE',
        })
        deleteLibrary(removeLibraryDialog.libraryToRemove?.id || '')
        navigate({ to: '/' })
        closeRemoveLibraryDialog()
      }} isDeleteAlert closeDialog={closeRemoveLibraryDialog} />
  )
}

export default RemoveLibraryDialog