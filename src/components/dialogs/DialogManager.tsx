import React from 'react'
import LibraryDialog from './library/LibraryDialog'
import RemoveLibraryDialog from './remove/RemoveLibraryDialog'
import ChangeEpisodesGroupDialog from './episodesGroup/ChangeEpisodesGroupDialog'
import ChangeIdentificationDialog from './identification/ChangeIdentificationDialog'

function DialogManager() {
  return (
    <>
      {/* Library Dialogs */}
      <LibraryDialog />
      <RemoveLibraryDialog />

      {/* Series Dialogs */}

      {/* Season Dialogs */}

      {/* Episode Dialogs */}

      {/* Identification And Episodes Group Dialogs */}
      <ChangeIdentificationDialog />
      <ChangeEpisodesGroupDialog />
    </>
  )
}

export default DialogManager
