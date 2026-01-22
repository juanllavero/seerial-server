export interface ImageProcessingServicePort {
  getImageColorPalette(
    imageSource: string,
    options: {
      targetLightness: { min: number; max: number };
      saturationFactor: number;
    }
  ): Promise<{
    originalPalette: any;
    colors: string[];
    css: string;
  }>;
  createTransparentImage(
    source: string,
    width: number,
    height: number
  ): Promise<Buffer>;
  getDirectoryListing(
    relativePath: string
  ): Promise<{ name: string; url: string }[]>;
  streamLocalImage(options: {
    filePath: string;
    res: any;
    width?: number;
    height?: number;
  }): Promise<void>;
  streamRemoteImage(options: {
    url: string;
    res: any;
    width?: number;
    height?: number;
  }): Promise<void>;
}
