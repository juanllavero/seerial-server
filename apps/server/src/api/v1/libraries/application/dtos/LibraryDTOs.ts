import type { LibraryType } from '@/data/interfaces/Media';

export interface CreateLibraryDTO {
  name: string;
  language: string;
  type: LibraryType;
  folders: string[];
  preferAudioLan?: string;
  preferSubLan?: string;
  subsMode?: string;
}

export interface UpdateLibraryDTO {
  name?: string;
  language?: string;
  type?: LibraryType;
  order?: number;
  hidden?: boolean;
  folders?: string[];
  preferAudioLan?: string;
  preferSubLan?: string;
  subsMode?: string;
  backgroundSrc?: string;
}

export interface ReorderLibrariesDTO {
  orderedLibraryIds: string[];
}

export interface ReorderItemsDTO {
  orderedItems: any[];
}

export interface GetLibraryContentDTO {
  type: string;
  flat?: string;
}
