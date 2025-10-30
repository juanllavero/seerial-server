import fs from "fs";
import multer from "multer";
import path from "path";

// Multer configuration to store files on disk
export const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    console.log({
      storagePath: req.body.destPath,
    });
    const resourcesPath = getExternalPath("resources");
    const destPath = req.body.destPath
      ? path.join(resourcesPath, req.body.destPath)
      : path.join(resourcesPath, "img", "DownloadCache"); // Destination path received from client or default

    // Create folder if it doesn't exist
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Function to upload files from client
export const upload = multer({ storage: storage }).fields([
  { name: "image", maxCount: 1 },
]);
