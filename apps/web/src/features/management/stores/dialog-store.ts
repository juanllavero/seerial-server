import { createWithEqualityFn } from 'zustand/traditional';

export type DialogPayloads = {
  // Libraries
  library: { id?: string }; // undefined = add, string = edit

  // Edit dialogs — id obligatorio
  collection: { id: string };
  movie: { id: string };
  series: { id: string };
  season: { id: string };
  episode: { id: string };
  album: { id: string };
  song: { id: string };

  // Delete dialogs — id obligatorio
  deleteSeries: { id: string };
  deleteMovie: { id: string };
  deleteSeason: { id: string };
  deleteEpisode: { id: string };
  deleteAlbum: { id: string };
  deleteSong: { id: string };
  deleteCollection: { id: string };
  removeLibrary: { id: string };

  // Feature dialogs
  identification: { seriesId?: string; movieId?: string };
  episodesGroup: { seriesId: string };
  downloadMedia: {
    type: 'music' | 'video';
    seriesId?: string;
    seasonId?: string;
    movieId?: string;
  };
};

export type DialogName = keyof DialogPayloads;

interface DialogState {
  open: DialogName | null;
  payload: DialogPayloads[DialogName] | null;
  openDialog: <T extends DialogName>(name: T, payload: DialogPayloads[T]) => void;
  closeDialog: () => void;
}

export const useDialogStore = createWithEqualityFn<DialogState>((set) => ({
  open: null,
  payload: null,
  openDialog: (name, payload) => set({ open: name, payload }),
  closeDialog: () => set({ open: null, payload: null }),
}));
