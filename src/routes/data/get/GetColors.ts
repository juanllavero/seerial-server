import axios from "axios";
import express from "express";
import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";
import { FilesManager } from "../../../utils/FilesManager";

const router = express.Router();

// --- INTERFAZ Y TIPOS (AHORA MÁS SIMPLES) ---
interface Swatch {
  // Usamos '[number, number, number]' para tipar un array de 3 números (tupla).
  rgb: [number, number, number];
  population: number;
  hex: string;
}

interface PlexPaletteOptions {
  targetLightness: { min: number; max: number };
  saturationFactor: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

// --- FUNCIONES DE AYUDA (SOLO LAS ESENCIALES) ---
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

// Una única función para oscurecer, si es necesario
function darken(rgb: number[]): { r: number; g: number; b: number } {
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0.08, Math.min(0.14, hsl.l * 0.5));
  return hslToRgb(hsl);
}

// --- FUNCIÓN MAESTRA DE CREACIÓN DE PALETA (VERSIÓN CONFIGURABLE) ---
function createPlexPalette(
  palette: any,
  options: PlexPaletteOptions
): string[] {
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

    // Ajuste de tono (Hue)
    const hue = hsl.h * 360;
    if (hue >= 300 && hue <= 350) {
      hsl.h = 280 / 360;
    } else if (hue > 20 && hue < 40) {
      hsl.h = 10 / 360;
    }

    // ✅ Uso de los nuevos parámetros de ajuste
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

// FUNCIÓN PARA GENERAR CSS (SIN CAMBIOS)
function generatePlexGradientCSS(colors: string[]): string {
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

// --- ENDPOINT PRINCIPAL (REESCRITO CON NODE-VIBRANT) ---
router.get("/image-colors", async (req: any, res: any) => {
  const { url, localPath, minLight, maxLight, sat } = req.query as {
    url?: string;
    localPath?: string;
    minLight?: string;
    maxLight?: string;
    sat?: string;
  };

  if (!url && !localPath) {
    return res.status(400).json({ error: 'Se requiere "url" o "localPath"' });
  }

  // `node-vibrant` acepta tanto una URL como una ruta local directamente
  const imageSource = localPath
    ? localPath.startsWith("resources")
      ? FilesManager.getExternalPath(localPath)
      : localPath
    : url!;

  try {
    const palette = await Vibrant.from(imageSource).getPalette();

    // Perfil 1: "Puro y Oscuro" (Ideal para el ejemplo rojo/naranja)
    // Produce colores muy oscuros y con una saturación más controlada.
    const options: PlexPaletteOptions = {
      targetLightness: {
        min: minLight ? parseFloat(minLight) : 0.04,
        max: maxLight ? parseFloat(maxLight) : 0.09,
      },
      saturationFactor: sat ? parseFloat(sat) : 1.0,
    };

    // Perfil 2: "Vibrante" (Ideal para el ejemplo púrpura/azul)
    // Produce colores un poco más brillantes y saturados.
    /*
        const options: PlexPaletteOptions = {
            targetLightness: { min: 0.08, max: 0.14 },
            saturationFactor: 1.2
        };
        */

    const plexColorsRgb = createPlexPalette(palette, options);
    const cssGradient = generatePlexGradientCSS(plexColorsRgb);

    res.json({
      originalPallete: palette,
      colors: plexColorsRgb,
      css: cssGradient,
    });
  } catch (error) {
    console.error("Error con node-vibrant:", error);
    res
      .status(500)
      .json({ error: "No se pudo procesar la imagen con node-vibrant." });
  }
});

// --- FUNCIÓN PARA CREAR LA MÁSCARA SVG ---
/**
 * Crea una cadena de texto SVG que representa una máscara con desvanecidos
 * en el lado izquierdo completo y en el lado inferior completo.
 * @param width - Ancho de la máscara.
 * @param height - Alto de la máscara.
 * @returns una cadena de texto con el código SVG.
 */
const createFadeMaskSvg = (width: number, height: number): string => {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="leftFade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="black" />
          {/* CAMBIADO: El degradado desde la izquierda ahora ocupa el 60% del ancho */}
          <stop offset="60%" stop-color="white" /> 
          <stop offset="100%" stop-color="white" />
        </linearGradient>

        <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="white" />
          {/* CAMBIADO: El degradado desde abajo ahora empieza al 40% de la altura */}
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
        "Faltan parámetros: se requiere (url o localPath), width y height."
      );
  }

  const finalWidth = parseInt(width, 10);
  const finalHeight = parseInt(height, 10);

  if (isNaN(finalWidth) || isNaN(finalHeight)) {
    return res.status(400).send("Width y height deben ser números válidos.");
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
    console.error("Error procesando la imagen:", error);
    res.status(500).send("No se pudo procesar la imagen.");
  }
});

export default router;
