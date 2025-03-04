import express from "express";
const router = express.Router();
import fs from "fs";
import path from "path";

// Get video file in user drive
router.get("/video-file", (req: any, res: any) => {
  // Ruta absoluta del vídeo, que puede estar en cualquier unidad
  const videoPath = decodeURIComponent(req.query.path); // Pasar la ruta del vídeo como parámetro en la query

  if (typeof videoPath !== "string") {
    return res.status(400).send("Invalid video path");
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res
        .status(416)
        .send("Requested range not satisfiable\n" + start + " >= " + fileSize);
      return;
    }

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": (() => {
        const ext = path.extname(videoPath).toLowerCase();
        switch (ext) {
          case ".mkv":
            return "video/x-matroska";
          case ".m2ts":
            return "video/MP2T";
          case ".mp4":
            return "video/mp4";
          case ".webm":
            return "video/webm";
          case ".avi":
            return "video/avi";
          case ".mov":
            return "video/quicktime";
          default:
            return "video/mp4"; // Unknown extension, fallback to MP4
        }
      })(),
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

export default router;
