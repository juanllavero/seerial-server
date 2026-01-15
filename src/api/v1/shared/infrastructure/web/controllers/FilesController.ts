import ApiError from "@/data/ApiError";
import { SanitizationManager } from "@/managers/SanitizationManager";
import fs from "fs";
import os from "os";
import path from "path";
import { Get, Query, Route, Security, Tags } from "tsoa";

interface DriveInfo {
  name: string;
}

interface DriveResponse {
  drives: string[];
}

interface FileItem {
  name: string;
  isFolder: boolean;
}

@Route("files")
@Tags("Files")
export class FilesController {
  /**
   * Get system drives
   */
  @Get("drives")
  @Security("adminAuth")
  public async getDrives(): Promise<string[]> {
    return getDrives();
  }

  /**
   * Get folder contents
   */
  @Get("folder")
  @Security("adminAuth")
  public async getFolderContents(@Query() path: string): Promise<FileItem[]> {
    try {
      const sanitizedPath = SanitizationManager.sanitizeDirectoryPath(
        path,
        SanitizationManager.getSystemAllowedPaths(),
        true // Must exist
      );

      return getFolderContent(sanitizedPath);
    } catch (error: any) {
      throw new ApiError(400, `Invalid folder path: ${error.message}`);
    }
  }
}

// From folders.ts
// Function to get drives in the system
const getDrives = () => {
  const drives = [];
  const platform = os.platform();

  // Get the directory of the current user
  const userHome = os.homedir();
  drives.push(userHome); // Add the user's directory as the first element

  if (platform === "win32") {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < letters.length; i++) {
      const drive = `${letters[i]}:\\`;
      if (fs.existsSync(drive)) {
        drives.push(drive);
      }
    }
  } else {
    // For Unix-like systems such as macOS or Linux
    drives.push("/"); // Add the root directory
    const volumes = "/Volumes"; // In macOS, external volumes are in /Volumes
    if (fs.existsSync(volumes)) {
      const mountedVolumes = fs.readdirSync(volumes);
      mountedVolumes.forEach((volume) => {
        drives.push(path.join(volumes, volume)); // Add each mounted volume
      });
    }
  }

  return drives;
};

// Function to get files and folders within a directory
const getFolderContent = (dirPath: string) => {
  const contents: FileItem[] = [];

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  items.forEach((item) => {
    // Filter hidden files and folders
    if (item.name.startsWith(".")) return;

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
