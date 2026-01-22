export interface Song {
  id?: string;
  albumId: string;
  title: string;
  codec: string;
  hasDolbyAtmos: boolean;
  trackNumber: number;
  discNumber: number;
  artists: string[];
  composers: string[];
  duration: number;
  fileSrc: string;
}
