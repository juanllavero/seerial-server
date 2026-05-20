import type { FileSystemServicePort } from '../ports/FileSystemServicePort';

/**
 * Centralizes local filesystem cleanup for all content types.
 * Each method deletes the folders/files stored for a given entity ID.
 */
export class ContentCleanupService {
  constructor(private readonly fs: FileSystemServicePort) {}

  // Helper method to get the external path for a given relative path
  getExternalPath(relativePath: string): string {
    return this.fs.getExternalPath(relativePath);
  }

  // Helper method to delete all media types for an entity
  cleanMedia(id: string): void {
    this.fs.deleteFolder(this.getExternalPath(`resources/music/${id}`));
    this.fs.deleteFolder(this.getExternalPath(`resources/videos/${id}`));
    this.fs.deleteFolder(this.getExternalPath(`resources/img/logos/${id}`));
    this.fs.deleteFolder(this.getExternalPath(`resources/img/posters/${id}`));
    this.fs.deleteFolder(this.getExternalPath(`resources/img/backgrounds/${id}`));
  }

  // Series
  cleanSeries(id: string): void {
    this.cleanMedia(id);
  }

  // Season
  cleanSeason(id: string): void {
    this.cleanMedia(id);
  }

  // Movie
  cleanMovie(id: string): void {
    this.cleanMedia(id);
  }

  // Video: thumbnail images (frame and chapters)
  cleanVideo(id: string): void {
    this.fs.deleteFolder(this.getExternalPath(`resources/img/thumbnails/video/${id}`));
    this.fs.deleteFolder(this.getExternalPath(`resources/img/thumbnails/chapters/${id}`));
  }

  // Album: poster image
  cleanAlbum(id: string): void {
    this.fs.deleteFolder(this.getExternalPath(`resources/img/posters/${id}`));
  }

  // Collection: poster and background images
  cleanCollection(id: string): void {
    this.fs.deleteFolder(this.getExternalPath(`resources/img/posters/${id}`));
    this.fs.deleteFolder(this.getExternalPath(`resources/img/backgrounds/${id}`));
  }
}
