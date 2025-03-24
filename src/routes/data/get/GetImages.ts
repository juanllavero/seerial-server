import express from "express";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { FilesManager } from "../../../data/utils/FilesManager";
import { Utils } from "../../../data/utils/Utils";
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

  fs.readdir(
    path.join(FilesManager.resourcesPath, imagesPath),
    (err, files) => {
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

      res.json(images);
    }
  );
});

// Endpoint para comprimir y devolver una imagen
router.get("/compressImage", async (req: any, res: any) => {
  const { imagePath } = req.query;

  if (!imagePath || typeof imagePath !== "string") {
    return res
      .status(400)
      .json({ error: "Debes proporcionar una ruta válida a la imagen." });
  }

  // Eliminar los parámetros de la URL (como el timestamp)
  const cleanedImagePath = imagePath.split("?")[0]; // Obtiene la ruta sin el query string

  const imgPath = path.join(FilesManager.resourcesPath, cleanedImagePath);

  if (!fs.existsSync(imgPath)) {
    return res.status(404).json({ error: "La imagen especificada no existe." });
  }

  // Ruta de salida de la imagen comprimida
  const outputFilePath = path.join(
    FilesManager.extPath,
    "cache",
    cleanedImagePath.replace(path.extname(cleanedImagePath), ".avif")
  );

  // Verificar si la imagen comprimida ya existe en caché
  // if (fs.existsSync(outputFilePath)) {
  //   // Si existe, devolver la imagen desde el caché
  //   return res.sendFile(outputFilePath, (err: any) => {
  //     if (err) {
  //       console.error("Error al enviar el archivo:", err);
  //       return res
  //         .status(500)
  //         .json({ error: "Error al enviar la imagen comprimida." });
  //     }
  //   });
  // }

  // Crear las carpetas necesarias si no existen
  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const compressionQuality = 10; // Calidad de compresión

  try {
    // Redimensionar la imagen si es necesario
    const resizedImagePath = path.join(
      outputDir,
      "resized-" + path.basename(imgPath)
    );
    await Utils.resizeToMaxResolution(imgPath, resizedImagePath);

    // Comprimir la imagen con ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg.setFfmpegPath(ffmpegPath || "");
      ffmpeg(resizedImagePath)
        .outputOptions([`-q:v ${Math.round((100 - compressionQuality) / 10)}`]) // Convertir calidad a escala de ffmpeg
        .output(outputFilePath)
        .outputFormat("avif")
        .on("end", () => {
          // Eliminar la imagen redimensionada temporal después de la compresión
          fs.unlinkSync(resizedImagePath);
          resolve();
        })
        .on("error", (err) => reject(err))
        .run();
    });

    // Enviar la imagen comprimida al cliente
    res.sendFile(outputFilePath, (err: any) => {
      if (err) {
        console.error("Error al enviar el archivo:", err);
        return res
          .status(500)
          .json({ error: "Error al enviar la imagen comprimida." });
      }
    });
  } catch (error) {
    console.error("Error al comprimir la imagen:", error);
    res.status(500).json({ error: "Error al comprimir la imagen." });
  }
});

export default router;
