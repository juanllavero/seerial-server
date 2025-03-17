import React from 'react'
import LibraryDialog from './library/LibraryDialog'
import RemoveLibraryDialog from './remove/RemoveLibraryDialog'

function DialogManager() {
  return (
    <>
      <LibraryDialog />
      <RemoveLibraryDialog />
    </>
  )
}

export default DialogManager
