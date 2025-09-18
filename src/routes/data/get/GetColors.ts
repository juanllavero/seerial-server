import axios from "axios";
import express from "express";
import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";
import { FilesManager } from "../../../utils/FilesManager";

const router = express.Router();

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

function rgbToHsl(rgb: number[]): HSL {
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

function hslToRgb(hsl: HSL): { r: number; g: number; b: number } {
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

function createPalette(palette: any, options: PaletteOptions): string[] {
  const profilePriority = ["DarkVibrant", "Muted", "LightVibrant", "Vibrant"];
  const finalRgbColors: { r: number; g: number; b: number }[] = [];
  const usedHex = new Set<string>();

  for (const profile of profilePriority) {
    if (finalRgbColors.length >= 4) break;

    const swatch = palette[profile] as Swatch | null;
    if (!swatch || usedHex.has(swatch.hex)) continue;

    const [r, g, b] = swatch.rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 15) continue;

    let hsl = rgbToHsl(swatch.rgb);

    const hue = hsl.h * 360;
    if (hue >= 300 && hue <= 350) {
      hsl.h = 280 / 360;
    } else if (hue > 20 && hue < 40) {
      hsl.h = 10 / 360;
    }

    hsl.s = Math.min(0.95, hsl.s * options.saturationFactor);
    hsl.l = Math.max(
      options.targetLightness.min,
      Math.min(options.targetLightness.max, hsl.l * 0.5)
    );

    const finalRgb = hslToRgb(hsl);
    finalRgbColors.push(finalRgb);
    usedHex.add(swatch.hex);
  }

  while (finalRgbColors.length > 0 && finalRgbColors.length < 4) {
    finalRgbColors.push(finalRgbColors[0]);
  }
  if (finalRgbColors.length === 0) {
    return Array(4).fill("rgb(25, 25, 25)");
  }

  return finalRgbColors.map((c) => `rgb(${c.r}, ${c.g}, ${c.b})`);
}

function generateGradientCSS(colors: string[]): string {
  const safeColors = [...colors];
  while (safeColors.length > 0 && safeColors.length < 4) {
    safeColors.push(safeColors[safeColors.length - 1]);
  }
  if (safeColors.length === 0) {
    return "background: black;";
  }
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

// Get image colors
router.get("/image-colors", async (req: any, res: any) => {
  const { url, localPath, minLight, maxLight, sat } = req.query as {
    url?: string;
    localPath?: string;
    minLight?: string;
    maxLight?: string;
    sat?: string;
  };

  if (!url && !localPath) {
    return res.status(400).json({ error: 'No "url" or "localPath" provided' });
  }

  const imageSource = localPath
    ? localPath.startsWith("resources")
      ? FilesManager.getExternalPath(localPath)
      : localPath
    : url!;

  try {
    const palette = await Vibrant.from(imageSource).getPalette();

    const options: PaletteOptions = {
      targetLightness: {
        min: minLight ? parseFloat(minLight) : 0.04,
        max: maxLight ? parseFloat(maxLight) : 0.09,
      },
      saturationFactor: sat ? parseFloat(sat) : 1.0,
    };

    const colorsRgb = createPalette(palette, options);
    const cssGradient = generateGradientCSS(colorsRgb);

    res.json({
      originalPallete: palette,
      colors: colorsRgb,
      css: cssGradient,
    });
  } catch (error) {
    console.error("node-vibrant error:", error);
    res
      .status(500)
      .json({ error: "Image could not be processed by node-vibrant" });
  }
});

// --- FUNCTION TO CREATE SVG MASK ---
/**
 * Creates an SVG string that represents a mask with fades
 * on the left side and the bottom side.
 * @param width - Width of the mask.
 * @param height - Height of the mask.
 * @returns an SVG string with the mask code.
 */
const createFadeMaskSvg = (width: number, height: number): string => {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="leftFade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="black" />
          <stop offset="60%" stop-color="white" /> 
          <stop offset="100%" stop-color="white" />
        </linearGradient>

        <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="white" />
          <stop offset="40%" stop-color="white" />
          <stop offset="100%" stop-color="black" />
        </linearGradient>

        <mask id="combined-mask">
            <rect x="0" y="0" width="${width}" height="${height}" fill="white" />
            <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bottomFade)" />
            <rect 
                x="0" 
                y="0" 
                width="${width}" 
                height="${height}" 
                fill="url(#leftFade)" 
                style="mix-blend-mode: darken;"
            />
        </mask>
      </defs>

      <rect x="0" y="0" width="${width}" height="${height}" fill="white" mask="url(#combined-mask)" />
    </svg>
  `;
};

router.get("/transparent-image-effect", async (req: any, res: any) => {
  const { url, localPath, width, height } = req.query as {
    url?: string;
    localPath?: string;
    width?: string;
    height?: string;
  };

  if ((!url && !localPath) || !width || !height) {
    return res
      .status(400)
      .send(
        "Not enough parameters. Please provide 'url' or 'localPath' and 'width' and 'height'."
      );
  }

  const finalWidth = parseInt(width, 10);
  const finalHeight = parseInt(height, 10);

  if (isNaN(finalWidth) || isNaN(finalHeight)) {
    return res.status(400).send("Width and height must be valid numbers.");
  }

  try {
    let sourceImageBuffer: Buffer;

    // 1. Obtener la imagen original
    if (url) {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      sourceImageBuffer = response.data;
    } else {
      // Asumiendo que tienes una forma de resolver la ruta local
      sourceImageBuffer = await sharp(localPath).toBuffer();
    }

    // 2. Redimensionar la imagen a las dimensiones finales
    const resizedImage = await sharp(sourceImageBuffer)
      .resize(finalWidth, finalHeight)
      .toBuffer();

    // 3. Crear la máscara SVG y convertirla a un buffer de imagen
    const maskSvg = createFadeMaskSvg(finalWidth, finalHeight);
    const maskBuffer = await sharp(Buffer.from(maskSvg)).toBuffer();

    // 4. Aplicar la máscara a la imagen
    // 'dest-in' es el modo de fusión que usa el canal alfa de la máscara
    const finalImageBuffer = await sharp(resizedImage)
      .composite([
        {
          input: maskBuffer,
          blend: "dest-in",
        },
      ])
      .png() // Asegurar que la salida sea PNG para soportar transparencia
      .toBuffer();

    // 5. Enviar la imagen procesada como respuesta
    res.setHeader("Content-Type", "image/png");
    res.send(finalImageBuffer);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).send("Error processing image.");
  }
});

export default router;
