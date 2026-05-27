import fs from 'node:fs';
import path from 'node:path';
import PropertiesReader, { type Reader } from 'properties-reader';
import {
  audioExtensions,
  imageExtensions,
  initFolders,
  LOCAL_DATA_PATH,
  videoExtensions,
} from '@/utils/constants';
import logger from '@/utils/logger';
import type { FileSystemServicePort } from '../../../application/ports/FileSystemServicePort';
import type { FileOrDir } from '../../../domain/types/FilesTypes';

const fileSystemLogger = logger.child({ category: 'File System' });

export class FileSystemServiceImpl implements FileSystemServicePort {
  public extPath = '/';
  public resourcesPath = this.getExternalPath('resources');
  public propertiesFilePath = this.getExternalPath(
    this.join('resources', 'config', 'keys.properties'),
  );

  public properties: Reader | undefined = undefined;

  //#region INITIALIZATION
  public initFolders(): void {
    for (const folderPath of initFolders) {
      this.createFolder(this.getExternalPath(folderPath));
    }
  }
  public loadProperties(): void {
    if (!fs.existsSync(this.propertiesFilePath)) {
      fs.writeFileSync(this.propertiesFilePath, '');
    }
    this.properties = PropertiesReader({
      sourceFile: this.propertiesFilePath,
    });
  }
  //#endregion

  //#region GET PATHS
  /**
   * Returns the absolute path for an external file relative to the executable (production)
   * or the project root (development). Creates parent directories if they don't exist.
   * @param relativePath - Relative path (e.g., 'resources/db/data.db', 'resources/config/config.json')
   * @returns Absolute path to the external file
   */
  public getExternalPath(relativePath: string): string {
    try {
      const baseDir = LOCAL_DATA_PATH;
      const fullPath = path.join(baseDir, relativePath);

      const isNumeric = !Number.isNaN(Number(relativePath));

      if (!isNumeric) {
        const parentDir = path.dirname(fullPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
      }

      return fullPath;
    } catch (_error) {
      return '';
    }
  }

  /**
   * Returns the absolute path for an internal file within src.
   * @param relativePath - Relative path within src (e.g., 'db/schema.ts')
   * @returns Absolute path to the internal file
   */
  public getInternalPath(relativePath: string): string {
    return path.join(__dirname, '@/', relativePath);
  }
  //#endregion

  //#region CHECK MEDIA FILES
  public isVideoFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
  }

  public isAudioFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return audioExtensions.includes(ext);
  }
  //#endregion

  //#region CHECK EXISTENCE
  public async exists(pathStr: string): Promise<boolean> {
    try {
      await fs.promises.access(pathStr, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  public existsSync(pathStr: string): boolean {
    return fs.existsSync(pathStr);
  }

  public async isFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.isFile();
    } catch (_error) {
      return false;
    }
  }
  public async isFolder(folderPath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(folderPath);
      return stats.isDirectory();
    } catch (_error) {
      return false;
    }
  }
  //#endregion

  //#region CREATE AND DELETE
  public createFolder(pathStr: string): void {
    if (!fs.existsSync(pathStr)) {
      fs.mkdirSync(pathStr, { recursive: true });
    }
  }
  public deleteFile(pathStr: string): void {
    try {
      if (fs.existsSync(pathStr)) {
        fs.unlinkSync(pathStr);
      }
    } catch (error) {
      fileSystemLogger.error(error, `Error deleting file ${pathStr}`);
    }
  }
  public deleteFolder(pathStr: string): void {
    try {
      if (fs.existsSync(pathStr)) {
        fs.rmSync(pathStr, { recursive: true, force: true });
      }
    } catch (error) {
      fileSystemLogger.error(error, `Error deleting directory ${pathStr}`);
    }
  }
  //#endregion

  //#region GET FILES
  public async getFileStats(pathStr: string) {
    try {
      return await fs.promises.stat(pathStr);
    } catch {
      return null;
    }
  }

  public getFileStatsSync(pathStr: string) {
    try {
      return fs.statSync(pathStr);
    } catch {
      return null;
    }
  }

  public getNamesInFolderSync(pathStr: string): string[] {
    try {
      return fs.readdirSync(pathStr);
    } catch {
      return [];
    }
  }

  public async getFoldersInFolder(pathStr: string): Promise<string[]> {
    const entries = await this.getFilesInFolder(pathStr);
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  }

  public getFoldersInFolderSync(pathStr: string): string[] {
    try {
      const entries = fs.readdirSync(pathStr, { withFileTypes: true });
      return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  public async getFileInFolder(pathStr: string, fileName: string): Promise<string | null> {
    try {
      const entries = await fs.promises.readdir(pathStr, {
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isFile() && entry.name === fileName) {
          return path.join(pathStr, entry.name);
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  public async getFilesInFolder(folderPath: string): Promise<FileOrDir[]> {
    try {
      const stats = await fs.promises.stat(folderPath);
      if (!stats.isDirectory()) return [];
      return await fs.promises.readdir(folderPath, { withFileTypes: true });
    } catch {
      return [];
    }
  }
  //#endregion

  //#region GET VALID MEDIA FILES
  public async getValidVideoFiles(folderPath: string): Promise<string[]> {
    const videoFiles: string[] = [];
    try {
      const filesAndFolders = await this.getFilesInFolder(folderPath);
      for (const fileOrFolder of filesAndFolders) {
        const fullPath = path.join(folderPath, fileOrFolder.name);
        if (fileOrFolder.isFile() && this.isVideoFile(fullPath)) {
          videoFiles.push(fullPath);
        } else if (fileOrFolder.isDirectory()) {
          const subFiles = await fs.promises.readdir(fullPath);
          for (const subFile of subFiles) {
            const subFilePath = path.join(fullPath, subFile);
            const st = await fs.promises.stat(subFilePath);
            if (st.isFile() && this.isVideoFile(subFilePath)) {
              videoFiles.push(subFilePath);
            }
          }
        }
      }
    } catch {}
    return videoFiles;
  }
  public async getValidMusicFiles(folderPath: string): Promise<string[]> {
    const musicFiles: string[] = [];
    const searchDepth = 4;
    const exploreDirectory = async (currentPath: string, currentDepth: number): Promise<void> => {
      const entries = await this.getFilesInFolder(currentPath);
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        if (entry.isFile() && this.isAudioFile(entryPath)) {
          musicFiles.push(entryPath);
        } else if (
          entry.isDirectory() &&
          currentDepth < searchDepth &&
          !entry.name.startsWith('[')
        ) {
          await exploreDirectory(entryPath, currentDepth + 1);
        }
      }
    };
    await exploreDirectory(folderPath, 0);
    return musicFiles;
  }
  public async findImageInFolder(folderPath: string): Promise<string | null> {
    const files = await fs.promises.readdir(folderPath);
    for (const file of files) {
      const fileExt = path.extname(file).toLowerCase();
      if (imageExtensions.includes(fileExt) && file.toLowerCase().includes('cover')) {
        return path.join(folderPath, file);
      }
    }
    return null;
  }
  //#endregion

  //#region JSON
  public createJSONFile(filePath: string, content: unknown): void {
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(content));
  }
  //#endregion

  //#region PATH OPERATIONS
  public dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  public basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  public extname(filePath: string): string {
    return path.extname(filePath);
  }

  public join(...paths: string[]): string {
    return path.join(...paths);
  }
  //#endregion

  //#region FILE READING
  public async readFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
  }

  public readFileSync(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
    return fs.readFileSync(filePath, encoding);
  }

  public async readFileBuffer(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(filePath);
  }
  //#endregion

  //#region STREAMS
  public createReadStream(
    filePath: string,
    options?: { start?: number; end?: number },
  ): NodeJS.ReadableStream {
    return fs.createReadStream(filePath, options);
  }

  public createWriteStream(filePath: string): NodeJS.WritableStream {
    return fs.createWriteStream(filePath);
  }
  //#endregion

  //#region FILE WRITING
  public async writeFile(
    filePath: string,
    content: string,
    encoding: BufferEncoding = 'utf-8',
  ): Promise<void> {
    return fs.promises.writeFile(filePath, content, encoding);
  }

  public writeFileSync(
    filePath: string,
    content: string,
    options: { encoding?: BufferEncoding; mode?: number } = {},
  ): void {
    fs.writeFileSync(filePath, content, options);
  }

  public chmod(pathStr: string, mode: number): void {
    fs.chmodSync(pathStr, mode);
  }

  public async writeImage(filePath: string, imageBuffer: Buffer): Promise<void> {
    await fs.promises.writeFile(filePath, imageBuffer);
  }
  //#endregion
}
