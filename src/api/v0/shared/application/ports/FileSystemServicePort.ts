import { FileOrDir } from "../../domain/types/FilesTypes";

export interface FileSystemServicePort {
  // Initialization
  initFolders(): void;
  loadProperties(): void;

  // Get paths
  getExternalPath(relativePath: string): string;
  getInternalPath(relativePath: string): string;

  // Check media files
  isVideoFile(filePath: string): boolean;
  isAudioFile(filePath: string): boolean;

  // Check existence
  isFile(path: string): Promise<boolean>;
  isFolder(path: string): Promise<boolean>;

  // Create and delete
  createFolder(path: string): void;
  deleteFile(path: string): void;
  deleteFolder(path: string): void;

  // Get files
  getFileInFolder(path: string): Promise<string | null>;
  getFilesInFolder(path: string): Promise<FileOrDir[]>;

  // Get valid media files
  getValidVideoFiles(folderPath: string): Promise<string[]>;
  getValidMusicFiles(folderPath: string): Promise<string[]>;
  findImageInFolder(folderPath: string): Promise<string | null>;

  // JSON
  createJSONFile(filePath: string, content: any): void;
}
