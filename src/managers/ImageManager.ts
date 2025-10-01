import { messages } from "@/config/messages";
import ApiError from "@/utils/ApiError";
import axios from "axios";
import { Response } from "express";
import fs from "fs-extra";
import { Vibrant } from "node-vibrant/node";
import path from "path";
import sharp from "sharp";
import { FilesManager } from "./FilesManager";

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

export class ImageManager {
  /**
   * Extracts a color palette from an image source and generates a CSS gradient.
   * @param imageSource - The URL or local path of the image.
   * @param options - Configuration for palette generation.
   * @returns An object containing the original palette, processed colors, and CSS gradient.
   */
  public static async getImageColorPalette(
    imageSource: string,
    options: PaletteOptions
  ) {
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
      console.error("node-vibrant error:", error);
      throw new ApiError(
        500,
        "The image could not be processed to extract colors."
      );
    }
  }

  /**
   * Fetches an image, resizes it, and applies a transparent fade effect using an SVG mask.
   * @param source - The URL or local path of the image.
   * @param width - The final width of the image.
   * @param height - The final height of the image.
   * @returns A Buffer containing the processed PNG image with transparency.
   */
  public static async createTransparentImage(
    source: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    try {
      let sourceImageBuffer: Buffer;

      // Get the source image buffer
      if (source.startsWith("http")) {
        const response = await axios.get(source, {
          responseType: "arraybuffer",
        });
        sourceImageBuffer = response.data;
      } else {
        const imagePath = source.startsWith("resources")
          ? FilesManager.getExternalPath(source)
          : source;
        sourceImageBuffer = await sharp(imagePath).toBuffer();
      }

      // Resize the image
      const resizedImage = await sharp(sourceImageBuffer)
        .resize(width, height)
        .toBuffer();

      // Create the SVG mask and convert it to a buffer
      const maskSvg = this._createFadeMaskSvg(width, height);
      const maskBuffer = await sharp(Buffer.from(maskSvg)).toBuffer();

      // Apply the mask using composite blending
      const finalImageBuffer = await sharp(resizedImage)
        .composite([{ input: maskBuffer, blend: "dest-in" }])
        .png() // Ensure output is PNG to support transparency
        .toBuffer();

      return finalImageBuffer;
    } catch (error) {
      console.error("Error processing transparent image effect:", error);
      throw new ApiError(
        500,
        "An error occurred while processing the image effect."
      );
    }
  }

  /**
   * Reads the contents of a directory and returns a list of image files.
   * @param relativePath - The path relative to the main resources directory.
   * @returns A promise that resolves to an array of image objects with name and url.
   */
  public static async getDirectoryListing(
    relativePath: string
  ): Promise<{ name: string; url: string }[]> {
    const absolutePath = path.join(FilesManager.resourcesPath, relativePath);

    try {
      await fs.ensureDir(absolutePath); // Ensures directory exists, creates if not.
      const files = await fs.readdir(absolutePath);

      return files.map((file) => ({
        name: file,
        url: path.join(relativePath, file), // Keep the relative path for the URL
      }));
    } catch (error) {
      console.error(`Error reading directory ${absolutePath}:`, error);
      throw new ApiError(500, "Error reading images folder.");
    }
  }

  /**
   * Streams a local image file, with on-the-fly resizing and compression.
   * @param options - Includes the file path, response object, and optional dimensions.
   */
  public static async streamLocalImage(options: {
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
    } catch (error) {
      throw new ApiError(404, messages.errors.notFound.file);
    }
  }

  /**
   * Streams a remote image from a URL, with on-the-fly resizing and compression.
   * @param options - Includes the URL, response object, and optional dimensions.
   */
  public static async streamRemoteImage(options: {
    url: string;
    res: Response;
    width?: number;
    height?: number;
  }): Promise<void> {
    const { url, res, width, height } = options;

    try {
      const response = await axios({
        method: "get",
        url,
        responseType: "stream",
      });
      this._compressAndStream(response.data, res, { width, height });
    } catch (error) {
      console.error("Error downloading or processing image from URL:", error);
      if (!res.headersSent) {
        throw new ApiError(
          500,
          "Could not download or process the image from the URL."
        );
      }
    }
  }

  //#region Private Static Helper Methods
  private static _createPalette(
    palette: any,
    options: PaletteOptions
  ): string[] {
    const profilePriority = ["DarkVibrant", "Muted", "LightVibrant", "Vibrant"];
    const finalRgbColors: { r: number; g: number; b: number }[] = [];
    const usedHex = new Set<string>();

    for (const profile of profilePriority) {
      if (finalRgbColors.length >= 4) break;
      const swatch = palette[profile] as Swatch | null;
      if (!swatch || usedHex.has(swatch.hex)) continue;
      const [r, g, b] = swatch.rgb;
      if (Math.max(r, g, b) - Math.min(r, g, b) < 15) continue;

      let hsl = this._rgbToHsl(swatch.rgb);
      const hue = hsl.h * 360;
      if (hue >= 300 && hue <= 350) hsl.h = 280 / 360;
      else if (hue > 20 && hue < 40) hsl.h = 10 / 360;

      hsl.s = Math.min(0.95, hsl.s * options.saturationFactor);
      hsl.l = Math.max(
        options.targetLightness.min,
        Math.min(options.targetLightness.max, hsl.l * 0.5)
      );

      finalRgbColors.push(this._hslToRgb(hsl));
      usedHex.add(swatch.hex);
    }

    while (finalRgbColors.length > 0 && finalRgbColors.length < 4) {
      finalRgbColors.push(finalRgbColors[0]);
    }

    if (finalRgbColors.length === 0) return Array(4).fill("rgb(25, 25, 25)");
    return finalRgbColors.map((c) => `rgb(${c.r}, ${c.g}, ${c.b})`);
  }

  private static _generateGradientCSS(colors: string[]): string {
    const safeColors = [...colors];
    while (safeColors.length > 0 && safeColors.length < 4) {
      safeColors.push(safeColors[safeColors.length - 1]);
    }
    if (safeColors.length === 0) return "background: black;";

    const cornerPositions = ["0% 100%", "100% 100%", "100% 0%", "0% 0%"];
    const gradients = cornerPositions.map((position, index) => {
      const solidColor = safeColors[index];
      const transparentColor = solidColor
        .replace("rgb", "rgba")
        .replace(")", ", 0)");
      return `radial-gradient(circle farthest-side at ${position}, ${solidColor} 0%, ${transparentColor} 100%)`;
    });

    return `background: ${gradients.join(", ")}, black;`;
  }

  private static _createFadeMaskSvg = (
    width: number,
    height: number
  ): string => `
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

  private static _rgbToHsl(rgb: number[]): HSL {
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

  private static _hslToRgb(hsl: HSL): { r: number; g: number; b: number } {
    const { h, s, l } = hsl;
    let r, g, b;
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
  private static _compressAndStream(
    inputStream: NodeJS.ReadableStream,
    res: Response,
    options: { width?: number; height?: number }
  ): void {
    const { width, height } = options;
    let transformer = sharp();

    if (width && height) {
      transformer = transformer.resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    transformer = transformer.jpeg({ quality: 85, progressive: true });
    res.setHeader("Content-Type", "image/jpeg");

    // --- Stream error handling ---
    inputStream.on("error", (err) => {
      console.error("Input stream error:", err);
      if (!res.headersSent)
        res.status(500).send("Error reading the source image.");
    });

    transformer.on("error", (err) => {
      console.error("Sharp processing error:", err);
      if (!res.headersSent) res.status(500).send("Error processing the image.");
    });

    inputStream.pipe(transformer).pipe(res);
  }

  //#endregion
}
