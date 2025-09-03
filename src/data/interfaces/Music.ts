export interface Artist {
  id: string
  name: string
}

export interface Album {
  id: string
  libraryId: string
  title: string
  year?: string
  genres: string[]
  folder: string
  description?: string
  collectionId: string
  coverSrc: string

  songs: Song[]
}

export interface Song {
  id: string
  albumId: string
  title: string
  codec: string
  trackNumber: number
  discNumber: number
  artists: string[]
  composers: string[]
  duration: number
  fileSrc: string
}

export interface LRCFile {
  content: string
  language: string
}

export interface LRCLine {
  time: number
  text: string
  originalLine: string
}

export interface MusicExtra {
  title: string
  src: string
  type: string
}
