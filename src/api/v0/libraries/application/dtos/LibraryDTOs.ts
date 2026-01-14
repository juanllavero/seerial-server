import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface CreateLibraryDTO {
  name: string;
  language: string;
  type: string;
  folders: string[];
  preferAudioLan?: string;
  preferSubLan?: string;
  subsMode?: string;
}

export interface UpdateLibraryDTO {
  name?: string;
  language?: string;
  type?: string;
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

export interface LibraryResponse extends ApiResponse {}

export interface LibrariesResponse extends ApiResponse {}
