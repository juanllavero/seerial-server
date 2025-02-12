import { SeriesData } from "../interfaces/SeriesData";

export interface LibraryData {
  id: string;
  name: string;
  language: string;
  type: string;
  order: number;
  folders: string[];
  series: SeriesData[];
  analyzedFiles: any;
  analyzedFolders: any;
  seasonFolders: any;
}
