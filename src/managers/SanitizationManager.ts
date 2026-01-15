import {
  audioExtensions,
  imageExtensions,
  videoExtensions,
} from "@/utils/constants";
import fs from "fs";
import os from "os";
import path from "path";

export class SanitizationManager {
  // Patterns to detect path traversal
  private static readonly dangerousPatterns = [
    /\.\./g, // Parent directory traversal
    /~\//g, // Home directory shortcuts
    /\0/g, // Null bytes
    /%00/g, // URL encoded null bytes
    /%2e%2e/gi, // URL encoded ..
    /%252e%252e/gi, // Double URL encoded ..
  ];

  /**
   * Sanitizes a file path and checks if it is secure
   * @param filePath File path to sanitize
   * @param allowedBasePaths Allowed base paths (optional)
   * @returns Sanitized file path
   * @throws Error if the path is invalid or insecure
   */
  public static sanitizeFilePath(
    filePath: string,
    allowedBasePaths?: string[]
  ): string {
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid file path: path must be a non-empty string");
    }

    // Decode URL encoding
    let decodedPath = decodeURIComponent(filePath);

    // Detect dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(decodedPath)) {
        throw new Error(
          "Invalid file path: contains dangerous patterns (path traversal attempt)"
        );
      }
    }

    // Normalize and resolve the path
    const normalizedPath = path.normalize(decodedPath);
    const resolvedPath = path.resolve(normalizedPath);

    // Verify that the path does not contain parent directory references after normalization
    if (resolvedPath.includes("..")) {
      throw new Error(
        "Invalid file path: contains parent directory references"
      );
    }

    // If allowed base paths are provided, verify that the path is within them
    if (allowedBasePaths && allowedBasePaths.length > 0) {
      const isWithinAllowedPath = allowedBasePaths.some((basePath) => {
        const resolvedBasePath = path.resolve(basePath);
        return resolvedPath.startsWith(resolvedBasePath);
      });

      if (!isWithinAllowedPath) {
        throw new Error(
          "Invalid file path: path is outside allowed directories"
        );
      }
    }

    return resolvedPath;
  }

  /**
   * Sanitizes and validates a directory path
   * @param dirPath Directory path to sanitize
   * @param allowedBasePaths Allowed base paths (optional)
   * @param shouldExist If the directory should exist
   * @returns Sanitized directory path
   */
  public static sanitizeDirectoryPath(
    dirPath: string,
    allowedBasePaths?: string[],
    shouldExist: boolean = false
  ): string {
    const sanitizedPath = this.sanitizeFilePath(dirPath, allowedBasePaths);

    if (shouldExist) {
      if (!fs.existsSync(sanitizedPath)) {
        throw new Error("Directory does not exist");
      }

      const stats = fs.statSync(sanitizedPath);
      if (!stats.isDirectory()) {
        throw new Error("Path is not a directory");
      }
    }

    return sanitizedPath;
  }

  /**
   * Sanitizes and validates a file path with a specific extension
   * @param filePath File path to sanitize
   * @param allowedExtensions Allowed extensions
   * @param allowedBasePaths Allowed base paths (optional)
   * @param shouldExist If the file should exist
   * @returns Sanitized file path
   */
  public static sanitizeFilePathWithExtension(
    filePath: string,
    allowedExtensions: string[],
    allowedBasePaths?: string[],
    shouldExist: boolean = false
  ): string {
    const sanitizedPath = this.sanitizeFilePath(filePath, allowedBasePaths);

    const ext = path.extname(sanitizedPath).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error(
        `Invalid file extension: ${ext}. Allowed: ${allowedExtensions.join(
          ", "
        )}`
      );
    }

    if (shouldExist) {
      if (!fs.existsSync(sanitizedPath)) {
        throw new Error("File does not exist");
      }

      const stats = fs.statSync(sanitizedPath);
      if (!stats.isFile()) {
        throw new Error("Path is not a file");
      }
    }

    return sanitizedPath;
  }

  /**
   * Sanitizes a video path
   */
  public static sanitizeVideoPath(
    videoPath: string,
    allowedBasePaths?: string[],
    shouldExist: boolean = true
  ): string {
    return this.sanitizeFilePathWithExtension(
      videoPath,
      videoExtensions,
      allowedBasePaths,
      shouldExist
    );
  }

  /**
   * Sanitizes an audio path
   */
  public static sanitizeAudioPath(
    audioPath: string,
    allowedBasePaths?: string[],
    shouldExist: boolean = true
  ): string {
    return this.sanitizeFilePathWithExtension(
      audioPath,
      audioExtensions,
      allowedBasePaths,
      shouldExist
    );
  }

  /**
   * Sanitizes an image path
   */
  public static sanitizeImagePath(
    imagePath: string,
    allowedBasePaths?: string[],
    shouldExist: boolean = true
  ): string {
    return this.sanitizeFilePathWithExtension(
      imagePath,
      imageExtensions,
      allowedBasePaths,
      shouldExist
    );
  }

  /**
   * Gets the default allowed paths of the system
   * Includes the user's home directory and mounted volumes
   */
  public static getSystemAllowedPaths(): string[] {
    const allowedPaths: string[] = [];
    const platform = os.platform();

    // Home directory
    allowedPaths.push(os.homedir());

    if (platform === "win32") {
      // On Windows, add all existing drives
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let i = 0; i < letters.length; i++) {
        const drive = `${letters[i]}:\\`;
        if (fs.existsSync(drive)) {
          allowedPaths.push(drive);
        }
      }
    } else {
      // On Unix-like (Linux, macOS)
      allowedPaths.push("/");

      // On macOS, add mounted volumes
      const volumes = "/Volumes";
      if (fs.existsSync(volumes)) {
        try {
          const mountedVolumes = fs.readdirSync(volumes);
          mountedVolumes.forEach((volume) => {
            allowedPaths.push(path.join(volumes, volume));
          });
        } catch (error) {
          console.error("Error reading volumes:", error);
        }
      }
    }

    return allowedPaths;
  }

  /**
   * Validates multiple file paths
   * @param filePaths Array of file paths to validate
   * @param allowedExtensions Allowed extensions (optional)
   * @param allowedBasePaths Allowed base paths (optional)
   * @returns Array of sanitized file paths
   */
  public static sanitizeMultipleFilePaths(
    filePaths: string[],
    allowedExtensions?: string[],
    allowedBasePaths?: string[]
  ): string[] {
    if (!Array.isArray(filePaths)) {
      throw new Error("File paths must be an array");
    }

    return filePaths.map((filePath) => {
      if (allowedExtensions) {
        return this.sanitizeFilePathWithExtension(
          filePath,
          allowedExtensions,
          allowedBasePaths
        );
      }
      return this.sanitizeFilePath(filePath, allowedBasePaths);
    });
  }

  /**
   * Combines a base path with a file name securely
   * @param basePath Base path
   * @param fileName File name
   * @returns Combined and sanitized path
   */
  public static safeJoinPath(basePath: string, fileName: string): string {
    // Sanitize the base path
    const sanitizedBase = this.sanitizeDirectoryPath(basePath);

    // Validate that the file name does not contain path separators
    if (!fileName || typeof fileName !== "string") {
      throw new Error("Invalid file name");
    }

    // Remove any slashes from the file name
    const cleanFileName = fileName.replace(/[/\\]/g, "");

    if (cleanFileName !== fileName) {
      throw new Error("File name contains path separators");
    }

    // Combine the paths
    const joinedPath = path.join(sanitizedBase, cleanFileName);

    // Verify that the resulting path is within the base path
    const resolvedJoined = path.resolve(joinedPath);
    const resolvedBase = path.resolve(sanitizedBase);

    if (!resolvedJoined.startsWith(resolvedBase)) {
      throw new Error("Resulting path is outside base directory");
    }

    return resolvedJoined;
  }

  /**
   * Validates a file name (without path)
   * @param fileName File name to validate
   * @returns true if the file name is valid
   */
  public static isValidFileName(fileName: string): boolean {
    if (!fileName || typeof fileName !== "string") {
      return false;
    }

    // Must not contain path separators
    if (fileName.includes("/") || fileName.includes("\\")) {
      return false;
    }

    // Must not contain null bytes
    if (fileName.includes("\0")) {
      return false;
    }

    // Must not be "." or ".."
    if (fileName === "." || fileName === "..") {
      return false;
    }

    return true;
  }
}
