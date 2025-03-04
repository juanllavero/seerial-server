import express from "express";
const router = express.Router();
import fs from "fs";
import path from "path";

// Get audio file in user drive
router.get("/audio", (req: any, res: any) => {
  // Ruta absoluta del audio, que puede estar en cualquier unidad
  const audioPath = decodeURIComponent(req.query.path); // Pasar la ruta del audio como parámetro en la query

  if (typeof audioPath !== "string") {
    return res.status(400).send("Invalid audio path");
  }

  const stat = fs.statSync(audioPath);
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
    const file = fs.createReadStream(audioPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": (() => {
        const ext = path.extname(audioPath).toLowerCase();
        switch (ext) {
          case ".mp3":
            return "audio/mp3";
          case ".ogg":
            return "audio/ogg";
          case ".wav":
            return "audio/wav";
          case ".aac":
            return "audio/aac";
          case ".m4a":
            return "audio/m4a";
          case ".flac":
            return "audio/flac";
          default:
            return "audio/*";
        }
      })(),
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "audio/mp3",
    };
    res.writeHead(200, head);
    fs.createReadStream(audioPath).pipe(res);
  }
});

export default router;
