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
  description?: string
  coverSrc: string

  songs: Song[]
}

export interface Song {
  id: string
  albumId: string
  title: string
  trackNumber: number
  discNumber: number
  artists: string[]
  composers: string[]
  duration: number
  fileSrc: string
}
