import { Album } from "../../albums/domain/Album";
import { Collection } from "../../collections/domain/Collection";
import { Movie } from "../../movies/domain/Movie";
import { Series } from "../../series/domain/Series";

export interface Library {
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
