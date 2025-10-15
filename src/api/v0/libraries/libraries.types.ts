import { Album, Collection, Movie, Series } from "@/api/v0/index.models";

export interface LibraryData {
  id: string;
  name: string;
  language: string;
  type: string;
  order: number;
  hidden: boolean;
  folders: string[];
  preferAudioLan?: string;
  preferSubLan?: string;
  subsMode?: string;
  analyzedFiles: Record<string, string>;
  analyzedFolders: Record<string, string>;
  backgroundSrc: string;

  series: Series[];
  movies: Movie[];
  albums: Album[];
  collections: Collection[];
}
