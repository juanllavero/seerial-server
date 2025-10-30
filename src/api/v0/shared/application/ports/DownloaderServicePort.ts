import { MediaSearchResult } from "@/data/interfaces/SearchResults";

export interface DownloaderServicePort {
  searchVideos(
    query: string,
    numberOfResults: number
  ): Promise<MediaSearchResult[]>;
  downloadVideo(
    url: string,
    downloadFolder: string,
    fileName: string
  ): Promise<void>;
  downloadAudio(
    url: string,
    downloadFolder: string,
    fileName: string
  ): Promise<void>;
}
