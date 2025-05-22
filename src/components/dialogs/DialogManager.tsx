import React from 'react'
import AlbumDialog from './album/AlbumDialog'
import CollectionDialog from './collection/CollectionDialog'
import EpisodeDialog from './episode/EpisodeDialog'
import ChangeEpisodesGroupDialog from './episodesGroup/ChangeEpisodesGroupDialog'
import ChangeIdentificationDialog from './identification/ChangeIdentificationDialog'
import LibraryDialog from './library/LibraryDialog'
import MovieDialog from './movie/MovieDialog'
import RemoveLibraryDialog from './remove/RemoveLibraryDialog'
import SeasonDialog from './season/SeasonDialog'

function DialogManager() {
  return (
    <>
      {/* Library Dialogs */}
      <LibraryDialog />
      <RemoveLibraryDialog />

      {/* Collection Dialogs */}
      <CollectionDialog />

      {/* Movie Dialogs */}
      <MovieDialog />

      {/* Series Dialogs */}

      {/* Season Dialogs */}
      <SeasonDialog />

      {/* Episode Dialogs */}
      <EpisodeDialog />

      {/* Album Dialogs */}
      <AlbumDialog />

      {/* Identification And Episodes Group Dialogs */}
      <ChangeIdentificationDialog />
      <ChangeEpisodesGroupDialog />
    </>
  )
}

export default DialogManager
