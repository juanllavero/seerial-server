import { https } from "follow-redirects";
import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import path from "path";
import { FilesManager } from "./FilesManager";

const binDir = FilesManager.getExternalPath(path.join("resources", "lib"));
export const ytDlpPath = path.join(
  binDir,
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
);

function getDownloadURL(): string {
  if (process.platform === "win32")
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
  if (process.platform === "darwin")
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos";
  return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";
}

/**
 * Downloads yt-dlp and assigns execution permissions on macOS/Linux
 */
export async function downloadYtDlp(): Promise<void> {
  if (existsSync(ytDlpPath)) {
    console.log("[DepCheck]: yt-dlp is already in:", ytDlpPath);
    return;
  }

  if (!existsSync(binDir)) mkdirSync(binDir, { recursive: true });

  const url = getDownloadURL();

  console.log("[DepCheck]: Downloading yt-dlp from:", url);

  return new Promise((resolve, reject) => {
    const file = createWriteStream(ytDlpPath);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `[DepCheck]: Error downloading yt-dlp. HTTP code ${response.statusCode}`
            )
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close(() => {
            try {
              if (process.platform !== "win32") {
                chmodSync(ytDlpPath, 0o755); // Add executable permission
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        });
      })
      .on("error", (err) => {
        // Clean partially downloaded file
        try {
          if (existsSync(ytDlpPath)) unlinkSync(ytDlpPath);
        } catch {}
        reject(err);
      });
  });
}
