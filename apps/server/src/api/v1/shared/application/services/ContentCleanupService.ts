import path from 'node:path';
import type { FileSystemServicePort } from '../ports/FileSystemServicePort';

/**
 * Centralizes local filesystem cleanup for all content types.
 */
export class ContentCleanupService {
  constructor(private readonly fs: FileSystemServicePort) { }

  getExternalPath(relativePath: string): string {
    return this.fs.getExternalPath(relativePath);
  }

  // Movie: delete the entire media/ folder inside the movie's folder
  cleanMovieMedia(movieFolder: string): void {
    this.fs.deleteFolder(path.join(movieFolder, 'media'));
  }

  // Series: delete the entire media/ folder inside the series' folder
  cleanSeriesMedia(seriesFolder: string): void {
    this.fs.deleteFolder(path.join(seriesFolder, 'media'));
  }

  // Season: delete only the s{N}_* files from the series' media/ folder
  cleanSeasonMedia(seriesFolder: string, seasonNumber: number): void {
    const mediaFolder = path.join(seriesFolder, 'media');
    if (!this.fs.existsSync(mediaFolder)) return;

    const prefix = `s${seasonNumber}_`;
    try {
      const files = this.fs.getNamesInFolderSync(mediaFolder);
      for (const file of files) {
        if (file.toLowerCase().startsWith(prefix)) {
          this.fs.deleteFile(path.join(mediaFolder, file));
        }
      }
    } catch {
      // Ignore errors if folder is not accessible
    }
  }

  // Collection: delete the media/ folder under resources/collections/{id}/
  cleanCollectionMedia(id: string): void {
    this.fs.deleteFolder(this.getExternalPath(`resources/collections/${id}/media`));
  }

  // Album: poster image (still in resources)
  cleanAlbum(id: string): void {
    this.fs.deleteFolder(this.getExternalPath(`resources/img/posters/${id}`));
  }

  // Video: thumbnail images (frame and chapters)
  cleanVideo(id: string): void {
    this.fs.deleteFolder(this.getExternalPath(`resources/img/thumbnails/video/${id}`));
    this.fs.deleteFolder(this.getExternalPath(`resources/img/thumbnails/chapters/${id}`));
  }
}
