import React from 'react'
import EpisodeDialog from './episode/EpisodeDialog'
import ChangeEpisodesGroupDialog from './episodesGroup/ChangeEpisodesGroupDialog'
import ChangeIdentificationDialog from './identification/ChangeIdentificationDialog'
import LibraryDialog from './library/LibraryDialog'
import RemoveLibraryDialog from './remove/RemoveLibraryDialog'

function DialogManager() {
  return (
    <>
      {/* Library Dialogs */}
      <LibraryDialog />
      <RemoveLibraryDialog />

      {/* Series Dialogs */}

      {/* Season Dialogs */}
      {/* <SeasonDialog /> */}

      {/* Episode Dialogs */}
      <EpisodeDialog />

      {/* Identification And Episodes Group Dialogs */}
      <ChangeIdentificationDialog />
      <ChangeEpisodesGroupDialog />
    </>
  )
}

export default DialogManager
