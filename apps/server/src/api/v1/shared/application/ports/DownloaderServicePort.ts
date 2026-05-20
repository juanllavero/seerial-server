import type { MediaSearchResult } from '@seerial/domain';

export interface DownloaderServicePort {
  downloadYoutubeDownloader(): Promise<void>;
  searchVideos(query: string, numberOfResults: number): Promise<MediaSearchResult[]>;
  downloadVideo(url: string, downloadFolder: string, fileName: string): Promise<void>;
  downloadAudio(url: string, downloadFolder: string, fileName: string): Promise<void>;
  autoDownloadFirstAudioResult(query: string, elementId: string): Promise<void>;
}
