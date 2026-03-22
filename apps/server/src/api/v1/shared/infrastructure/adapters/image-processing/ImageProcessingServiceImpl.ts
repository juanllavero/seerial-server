import path from 'node:path';
import { type LibraryType, LibraryTypes } from '@seerial/domain';
import axios from 'axios';
import type { Response } from 'express';
import fs from 'fs-extra';
import { Vibrant } from 'node-vibrant/node';
import sharp from 'sharp';
import { messages } from '@/config/messages';
import logger from '@/utils/logger';
import type { FileSystemServicePort } from '../../../application/ports/FileSystemServicePort';
import type { ImageProcessingServicePort } from '../../../application/ports/ImageProcessingServicePort';
import { NotFoundException } from '../../web/exceptions/HTTPExceptions';
import { fileSystemService } from '../di/container';

const imageProcessingLogger = logger.child({ category: 'Image Processing' });

export type CollageTileRatio = 'square' | 'poster'; // 1:1 or 2:3

interface CollageDimensions {
  width: number;
  height: number;
}

interface Swatch {
  rgb: [number, number, number];
  population: number;
  hex: string;
}

interface PaletteOptions {
  targetLightness: { min: number; max: number };
  saturationFactor: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface Palette {
  [name: string]: Swatch | null;
  Vibrant: Swatch | null;
  Muted: Swatch | null;
  DarkVibrant: Swatch | null;
  DarkMuted: Swatch | null;
  LightVibrant: Swatch | null;
  LightMuted: Swatch | null;
}

export class ImageProcessingServiceImpl implements ImageProcessingServicePort {
  constructor(private readonly fileSystemService: FileSystemServicePort) {}

  async getImageColorPalette(imageSource: string, options: PaletteOptions) {
    try {
      const palette = await Vibrant.from(imageSource).getPalette();
      const colorsRgb = this._createPalette(palette, options);
      const cssGradient = this._generateGradientCSS(colorsRgb);

      return {
        originalPalette: palette,
        colors: colorsRgb,
        css: cssGradient,
      };
    } catch (error) {
      imageProcessingLogger.error(error, 'node-vibrant error');
      throw new Error('The image could not be processed to extract colors.');
    }
  }

  async createTransparentImage(source: string, width: number, height: number): Promise<Buffer> {
    try {
      let sourceImageBuffer: Buffer;

      // Get the source image buffer
      if (source.startsWith('http')) {
        const response = await axios.get(source, {
          responseType: 'arraybuffer',
        });
        sourceImageBuffer = response.data;
      } else {
        const imagePath = source.startsWith('resources')
          ? fileSystemService.getExternalPath(source)
          : source;
        sourceImageBuffer = await sharp(imagePath).toBuffer();
      }

      // Resize the image
      const resizedImage = await sharp(sourceImageBuffer).resize(width, height).toBuffer();

      // Create the SVG mask and convert it to a buffer
      const maskSvg = this._createFadeMaskSvg(width, height);
      const maskBuffer = await sharp(Buffer.from(maskSvg)).toBuffer();

      // Apply the mask using composite blending
      const finalImageBuffer = await sharp(resizedImage)
        .composite([{ input: maskBuffer, blend: 'dest-in' }])
        .png() // Ensure output is PNG to support transparency
        .toBuffer();

      return finalImageBuffer;
    } catch (error) {
      imageProcessingLogger.error(error, 'Error processing transparent image effect');
      throw new Error('An error occurred while processing the image effect.');
    }
  }

  async getDirectoryListing(relativePath: string): Promise<{ name: string; url: string }[]> {
    const absolutePath = this.fileSystemService.getExternalPath(relativePath);
    const fs = require('node:fs').promises;

    try {
      await fs.mkdir(absolutePath, { recursive: true });
      const files = await fs.readdir(absolutePath);
      return files.map((file: string) => ({
        name: file,
        url: require('node:path').join(relativePath, file),
      }));
    } catch (error) {
      imageProcessingLogger.error(error, `Error reading directory ${absolutePath}`);
      throw new Error('Error reading images folder.');
    }
  }

  async streamLocalImage(options: {
    filePath: string;
    res: Response;
    width?: number;
    height?: number;
  }): Promise<void> {
    const { filePath, res, width, height } = options;
    const resolvedPath = path.resolve(decodeURIComponent(filePath));

    try {
      await fs.access(resolvedPath, fs.constants.F_OK);
      const inputStream = fs.createReadStream(resolvedPath);
      this._compressAndStream(inputStream, res, { width, height });
    } catch (_error) {
      throw new NotFoundException(messages.errors.notFound.file);
    }
  }

  async streamRemoteImage(options: {
    url: string;
    res: Response;
    width?: number;
    height?: number;
  }): Promise<void> {
    const { url, res, width, height } = options;

    try {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
      });
      this._compressAndStream(response.data, res, { width, height });
    } catch (error) {
      imageProcessingLogger.error(error, 'Error downloading or processing image from URL');
      if (!res.headersSent) {
        throw new Error('Could not download or process the image from the URL.');
      }
    }
  }

  //#region Private Static Helper Methods
  private _createPalette(palette: Palette, options: PaletteOptions): string[] {
    const profilePriority = ['DarkVibrant', 'Muted', 'LightVibrant', 'Vibrant'];
    const finalRgbColors: { r: number; g: number; b: number }[] = [];
    const usedHex = new Set<string>();

    for (const profile of profilePriority) {
      if (finalRgbColors.length >= 4) break;
      const swatch = palette[profile] as Swatch | null;
      if (!swatch || usedHex.has(swatch.hex)) continue;
      const [r, g, b] = swatch.rgb;
      if (Math.max(r, g, b) - Math.min(r, g, b) < 15) continue;

      const hsl = this._rgbToHsl(swatch.rgb);
      const hue = hsl.h * 360;
      if (hue >= 300 && hue <= 350) hsl.h = 280 / 360;
      else if (hue > 20 && hue < 40) hsl.h = 10 / 360;

      hsl.s = Math.min(0.95, hsl.s * options.saturationFactor);
      hsl.l = Math.max(
        options.targetLightness.min,
        Math.min(options.targetLightness.max, hsl.l * 0.5),
      );

      finalRgbColors.push(this._hslToRgb(hsl));
      usedHex.add(swatch.hex);
    }

    while (finalRgbColors.length > 0 && finalRgbColors.length < 4) {
      finalRgbColors.push(finalRgbColors[0]);
    }

    if (finalRgbColors.length === 0) return Array(4).fill('rgb(25, 25, 25)');
    return finalRgbColors.map((c) => `rgb(${c.r}, ${c.g}, ${c.b})`);
  }

  private _generateGradientCSS(colors: string[]): string {
    const safeColors = [...colors];
    while (safeColors.length > 0 && safeColors.length < 4) {
      safeColors.push(safeColors[safeColors.length - 1]);
    }
    if (safeColors.length === 0) return 'background: black;';

    const cornerPositions = ['0% 100%', '100% 100%', '100% 0%', '0% 0%'];
    const gradients = cornerPositions.map((position, index) => {
      const solidColor = safeColors[index];
      const transparentColor = solidColor.replace('rgb', 'rgba').replace(')', ', 0)');
      return `radial-gradient(circle farthest-side at ${position}, ${solidColor} 0%, ${transparentColor} 100%)`;
    });

    return `background: ${gradients.join(', ')}, black;`;
  }

  private _createFadeMaskSvg = (width: number, height: number): string => `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leftFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="black" /><stop offset="60%" stop-color="white" /><stop offset="100%" stop-color="white" />
          </linearGradient>
          <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="white" /><stop offset="40%" stop-color="white" /><stop offset="100%" stop-color="black" />
          </linearGradient>
          <mask id="combined-mask">
            <rect x="0" y="0" width="${width}" height="${height}" fill="white" />
            <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bottomFade)" />
            <rect x="0" y="0" width="${width}" height="${height}" fill="url(#leftFade)" style="mix-blend-mode: darken;" />
          </mask>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height}" fill="white" mask="url(#combined-mask)" />
      </svg>`;

  private _rgbToHsl(rgb: number[]): HSL {
    const r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  private _hslToRgb(hsl: HSL): { r: number; g: number; b: number } {
    const { h, s, l } = hsl;
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Private helper to process an image stream with Sharp and pipe it to the response.
   * @param inputStream - The source image data stream.
   * @param res - The Express response object.
   * @param options - Resizing options (width, height).
   */
  private _compressAndStream(
    inputStream: NodeJS.ReadableStream,
    res: Response,
    options: { width?: number; height?: number },
  ): void {
    const { width, height } = options;
    let transformer = sharp();

    if (width && height) {
      transformer = transformer.resize({
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    transformer = transformer.jpeg({ quality: 85, progressive: true });
    res.setHeader('Content-Type', 'image/jpeg');

    // --- Stream error handling ---
    inputStream.on('error', (err) => {
      imageProcessingLogger.error(err, 'Input stream error');
      if (!res.headersSent) res.status(500).send('Error reading the source image.');
    });

    transformer.on('error', (err) => {
      imageProcessingLogger.error(err, 'Sharp processing error');
      if (!res.headersSent) res.status(500).send('Error processing the image.');
    });

    inputStream.pipe(transformer).pipe(res);
  }
  //#endregion

  //#region Collection Images

  private async loadImageBuffer(src: string, libraryType: LibraryType): Promise<Buffer> {
    const defaultPath = fileSystemService.getExternalPath(
      fileSystemService.join(
        'resources',
        'img',
        'default',
        `${
          libraryType === LibraryTypes.MUSIC
            ? 'music'
            : libraryType === LibraryTypes.MOVIES
              ? 'movie'
              : 'series'
        }.jpg`,
      ),
    );
    if (!src) return fs.readFileSync(defaultPath);

    try {
      if (src.startsWith('http')) {
        const res = await axios.get(src, {
          responseType: 'arraybuffer',
          timeout: 5000,
        });
        return Buffer.from(res.data);
      } else {
        const filePath = fileSystemService.getExternalPath(src);
        return fs.readFileSync(filePath);
      }
    } catch {
      return fs.readFileSync(defaultPath);
    }
  }

  private async resizeToTile(
    src: string,
    width: number,
    height: number,
    libraryType: LibraryType,
  ): Promise<Buffer> {
    const raw = await this.loadImageBuffer(src, libraryType);
    return sharp(raw).resize(width, height, { fit: 'cover' }).toBuffer();
  }

  private getCollageDimensions(ratio: CollageTileRatio): CollageDimensions {
    const TILE_WIDTH = 200;
    return {
      width: TILE_WIDTH,
      height: ratio === 'square' ? TILE_WIDTH : Math.round((TILE_WIDTH * 3) / 2), // 200x200 o 200x300
    };
  }

  /**
   * Generates a 2x2 collage with 1-4 images.
   */
  async generateCollage(
    imageSrcs: string[],
    ratio: CollageTileRatio = 'poster',
    libraryType: LibraryType,
  ): Promise<Buffer> {
    const { width: tileW, height: tileH } = this.getCollageDimensions(ratio);
    const totalW = tileW * 2;
    const totalH = tileH * 2;

    const sources = [...imageSrcs.slice(0, 4)];
    while (sources.length < 4) sources.push('');

    const tiles = await Promise.all(
      sources.map((src) => this.resizeToTile(src, tileW, tileH, libraryType)),
    );

    return sharp({
      create: {
        width: totalW,
        height: totalH,
        channels: 3,
        background: { r: 30, g: 30, b: 30 },
      },
    })
      .composite([
        { input: tiles[0], top: 0, left: 0 },
        { input: tiles[1], top: 0, left: tileW },
        { input: tiles[2], top: tileH, left: 0 },
        { input: tiles[3], top: tileH, left: tileW },
      ])
      .jpeg({ quality: 85 })
      .toBuffer();
  }
  //#endregion
}
