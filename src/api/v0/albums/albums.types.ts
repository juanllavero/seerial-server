export interface AlbumData {
  id?: string;
  libraryId: string;
  title: string;
  year?: string;
  genres: string[];
  folder: string;
  description?: string;
  coverSrc: string;
}
