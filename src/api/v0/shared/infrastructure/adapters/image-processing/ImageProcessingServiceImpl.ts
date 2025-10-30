import ApiError from "@/data/ApiError";
import { ImageProcessingServicePort } from "../../../application/ports/ImageProcessingServicePort";

export class ImageProcessingServiceImpl implements ImageProcessingServicePort {
  constructor(private readonly fileSystemService: any) {}

  async getImageColorPalette(imageSource: string, options: any): Promise<any> {
    throw new ApiError(501, "Image color palette not implemented yet");
  }

  async createTransparentImage(
    source: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    throw new ApiError(501, "Image transparency not implemented yet");
  }

  async getDirectoryListing(relativePath: string): Promise<any[]> {
    const absolutePath = require("path").join(
      this.fileSystemService.resourcesPath,
      relativePath
    );
    const fs = require("fs").promises;

    try {
      await fs.mkdir(absolutePath, { recursive: true });
      const files = await fs.readdir(absolutePath);
      return files.map((file: string) => ({
        name: file,
        url: require("path").join(relativePath, file),
      }));
    } catch (error) {
      console.error(`Error reading directory ${absolutePath}:`, error);
      throw new ApiError(500, "Error reading images folder.");
    }
  }

  async streamLocalImage(options: {
    filePath: string;
    res: any;
    width?: number;
    height?: number;
  }): Promise<void> {
    throw new ApiError(501, "Local image streaming not implemented yet");
  }

  async streamRemoteImage(options: {
    url: string;
    res: any;
    width?: number;
    height?: number;
  }): Promise<void> {
    throw new ApiError(501, "Remote image streaming not implemented yet");
  }
}
