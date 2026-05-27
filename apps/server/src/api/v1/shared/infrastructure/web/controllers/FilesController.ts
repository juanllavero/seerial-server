import os from 'node:os';
import path from 'node:path';
import { Get, Query, Route, Security, Tags } from 'tsoa';
import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { messages } from '@/config/messages';
import { getSystemAllowedPaths, sanitizeDirectoryPath } from '../../services/SanitizationService';
import { ApiResponse } from '../http/APIResponse';

interface FileItem {
  name: string;
  isFolder: boolean;
}

@Route('files')
@Tags('Files')
export class FilesController {
  /**
   * Get system drives
   */
  @Get('drives')
  @Security('adminAuth')
  public async getDrives(): Promise<ApiResponse<string[]>> {
    const drives = [];
    const platform = os.platform();

    // Get the directory of the current user
    const userHome = os.homedir();
    drives.push(userHome); // Add the user's directory as the first element

    if (platform === 'win32') {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < letters.length; i++) {
        const drive = `${letters[i]}:\\`;
        if (fileSystemService.existsSync(drive)) {
          drives.push(drive);
        }
      }
    } else {
      // For Unix-like systems such as macOS or Linux
      drives.push('/'); // Add the root directory
      const volumes = '/Volumes'; // In macOS, external volumes are in /Volumes
      if (fileSystemService.existsSync(volumes)) {
        const mountedVolumes = fileSystemService.getFoldersInFolderSync(volumes);
        mountedVolumes.forEach((volume) => {
          drives.push(path.join(volumes, volume)); // Add each mounted volume
        });
      }
    }

    return ApiResponse.success(drives, messages.success.fetch);
  }

  /**
   * Get folder contents
   */
  @Get('folder')
  @Security('adminAuth')
  public async getFolderContents(@Query() path: string): Promise<ApiResponse<FileItem[]>> {
    const sanitizedPath = sanitizeDirectoryPath(
      path,
      getSystemAllowedPaths(),
      true, // Must exist
    );

    const content = await getFolderContent(sanitizedPath);
    return ApiResponse.success(content, messages.success.fetch);
  }
}

// Function to get files and folders within a directory
const getFolderContent = async (dirPath: string): Promise<FileItem[]> => {
  const contents: FileItem[] = [];

  if (!fileSystemService.existsSync(dirPath)) {
    fileSystemService.createFolder(dirPath);
  }
  const items = await fileSystemService.getFilesInFolder(dirPath);

  items.forEach((item) => {
    // Filter hidden files and folders
    if (item.name.startsWith('.')) return;

    if (item.isDirectory()) {
      contents.push({ name: item.name, isFolder: true });
    } else {
      contents.push({ name: item.name, isFolder: false });
    }
  });

  // Order: folders first, then files, alphabetically
  contents.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  return contents;
};
