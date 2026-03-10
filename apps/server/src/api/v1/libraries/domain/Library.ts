import type { LibraryType } from '@/data/interfaces/Media';
import type { Album } from '../../albums/domain/Album';
import type { Collection } from '../../collections/domain/Collection';
import type { Movie } from '../../movies/domain/Movie';
import type { Series } from '../../series/domain/Series';

export interface Library {
  id: string;
  name: string;
  language: string;
  type: LibraryType;
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
