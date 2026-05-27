import type { LibraryType } from '@seerial/domain';
import type { CollageTileRatio } from '../../infrastructure/adapters/image-processing/ImageProcessingServiceImpl';

export interface ImageProcessingServicePort {
  getImageColorPalette(
    imageSource: string,
    options: {
      targetLightness: { min: number; max: number };
      saturationFactor: number;
    },
  ): Promise<{
    originalPalette: unknown;
    colors: string[];
    css: string;
  }>;
  createTransparentImage(source: string, width: number, height: number): Promise<Buffer>;
  getDirectoryListing(folderPath: string): Promise<{ name: string; url: string }[]>;
  streamLocalImage(options: {
    filePath: string;
    res: unknown;
    width?: number;
    height?: number;
  }): Promise<void>;
  streamRemoteImage(options: {
    url: string;
    res: unknown;
    width?: number;
    height?: number;
  }): Promise<void>;
  generateCollage(
    imageSrcs: string[],
    ratio: CollageTileRatio,
    libraryType: LibraryType,
  ): Promise<Buffer>;
}
