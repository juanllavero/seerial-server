import type { FileOrDir } from '../../domain/types/FilesTypes';

export interface FileSystemStats {
  size: number;
  isFile: () => boolean;
  isDirectory: () => boolean;
}

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
  exists(path: string): Promise<boolean>;
  existsSync(path: string): boolean;
  isFile(path: string): Promise<boolean>;
  isFolder(path: string): Promise<boolean>;

  // Create and delete
  createFolder(path: string): void;
  deleteFile(path: string): void;
  deleteFolder(path: string): void;

  // Get files
  getFileStats(path: string): Promise<FileSystemStats | null>;
  getFileStatsSync(path: string): FileSystemStats | null;
  getNamesInFolderSync(path: string): string[];
  getFoldersInFolder(path: string): Promise<string[]>;
  getFoldersInFolderSync(path: string): string[];
  getFileInFolder(path: string, fileName: string): Promise<string | null>;
  getFilesInFolder(path: string): Promise<FileOrDir[]>;

  // Get valid media files
  getValidVideoFiles(folderPath: string): Promise<string[]>;
  getValidMusicFiles(folderPath: string): Promise<string[]>;
  findImageInFolder(folderPath: string): Promise<string | null>;

  // JSON
  createJSONFile(filePath: string, content: unknown): void;

  // Path operations
  dirname(filePath: string): string;
  basename(filePath: string, ext?: string): string;
  extname(filePath: string): string;
  join(...paths: string[]): string;

  // File reading
  readFile(filePath: string): Promise<string>;
  readFileSync(filePath: string, encoding?: string): string;
  readFileBuffer(filePath: string): Promise<Buffer>;

  // Streams
  createReadStream(filePath: string, options?: { start?: number; end?: number }): NodeJS.ReadableStream;
  createWriteStream(filePath: string): NodeJS.WritableStream;

  // File writing
  writeFile(filePath: string, content: string, encoding?: string): Promise<void>;
  writeFileSync(filePath: string, content: string, options?: { encoding?: BufferEncoding; mode?: number }): void;
  chmod(path: string, mode: number): void;

  // Image writing
  writeImage(filePath: string, imageBuffer: Buffer): Promise<void>;
}
