export interface Artist {
  id?: number;
  name: string;
}

export interface Album {
  id?: number;
  libraryID: number;
  title: string;
  year?: string;
  description?: string;
}

export interface Song {
  id?: number;
  albumID: number;
  title: string;
  trackNumber: number;
}
