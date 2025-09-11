import axios from "axios";
import express, { Response } from "express";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { FilesManager } from "../../../utils/FilesManager";
const router = express.Router();

// Serve images to outside
router.use(
  "/img",
  express.static(path.join(FilesManager.resourcesPath, "img"))
);

router.get("/images", (req: any, res: any) => {
  const imagesPath = decodeURIComponent(req.query.path);

  if (typeof imagesPath !== "string") {
    return res.status(400).send("Invalid images path");
  }

  const dirPath = path.join(FilesManager.resourcesPath, imagesPath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading images folder");
    }

    const images = files.map((file) => {
      const filePath = path.join(imagesPath, file);
      return {
        name: file,
        url: filePath,
      };
    });

    return res.json(images);
  });
});

router.get("/image", async (req: any, res: any) => {
  const { path: imagePath, width, height } = req.query;

  if (typeof imagePath !== "string" || imagePath.trim() === "") {
    return res.status(400).send("Ruta de imagen inválida.");
  }

  const resolvedPath = path.resolve(decodeURIComponent(imagePath));

  try {
    // Verificamos si el archivo existe antes de crear el stream
    await fs.promises.access(resolvedPath, fs.constants.F_OK);

    // Creamos un stream de lectura del archivo local
    const inputStream = fs.createReadStream(resolvedPath);

    // Llamamos a nuestra función reutilizable
    compressAndStreamImage(inputStream, res, { width, height });
  } catch (error) {
    console.error(
      `Archivo no encontrado o inaccesible: ${resolvedPath}`,
      error
    );
    return res.status(404).send("Imagen no encontrada.");
  }
});

router.get("/compress-image", async (req: any, res: any) => {
  const { url, width, height } = req.query;

  if (!url || !width || !height) {
    return res.status(400).send("Faltan los parámetros: url, width y height.");
  }

  // La validación de width/height se delega a la función `compressAndStreamImage`

  try {
    // Descargamos la imagen como un stream
    const response = await axios({
      method: "get",
      url: String(url),
      responseType: "stream",
    });

    // Llamamos a la misma función reutilizable con el stream de la descarga
    compressAndStreamImage(response.data, res, { width, height });
  } catch (error: any) {
    console.error(
      "Error al descargar o procesar la imagen desde URL:",
      error.message
    );
    if (!res.headersSent) {
      res.status(500).send("No se pudo descargar o procesar la imagen.");
    }
  }
});

/**
 * Procesa un stream de imagen, la redimensiona/comprime con Sharp y la envía como respuesta.
 * @param inputStream - El stream de datos de la imagen fuente.
 * @param res - El objeto de respuesta de Express.
 * @param options - Opciones de compresión como width y height.
 */
const compressAndStreamImage = (
  inputStream: NodeJS.ReadableStream,
  res: Response,
  options: { width?: string; height?: string }
) => {
  const { width, height } = options;

  const parsedWidth = width ? parseInt(width, 10) : NaN;
  const parsedHeight = height ? parseInt(height, 10) : NaN;

  // 1. Inicia el transformador de Sharp
  let transformer = sharp();

  // 2. Aplica redimensión si se proporcionaron dimensiones válidas
  if (!isNaN(parsedWidth) && !isNaN(parsedHeight)) {
    transformer = transformer.resize({
      width: parsedWidth,
      height: parsedHeight,
      fit: "inside", // Mantiene la relación de aspecto
      withoutEnlargement: true, // No agranda la imagen si es más pequeña
    });
  }

  // 3. Aplica la compresión a JPEG
  transformer = transformer.jpeg({
    quality: 85, // Calidad de compresión (1-100)
    progressive: true, // Mejora la experiencia de carga
  });

  // 4. Establece la cabecera de la respuesta
  res.setHeader("Content-Type", "image/jpeg");

  // 5. Manejo de errores en los streams para evitar que el servidor se caiga
  inputStream.on("error", (err) => {
    console.error("Error en el stream de entrada:", err);
    if (!res.headersSent) {
      res.status(500).send("Error al leer la imagen de origen.");
    }
  });

  transformer.on("error", (err) => {
    console.error("Error de Sharp al procesar la imagen:", err);
    if (!res.headersSent) {
      res.status(500).send("Error al procesar la imagen.");
    }
  });

  // 6. Conecta todo: Stream de entrada -> Sharp -> Respuesta HTTP
  inputStream.pipe(transformer).pipe(res);
};

export default router;
