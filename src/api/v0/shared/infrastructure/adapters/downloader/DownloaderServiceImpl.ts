import { fileSystemService } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { MediaSearchResult } from "@/data/interfaces/SearchResults";
import { exec, spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { https } from "follow-redirects";
import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import path from "path";
import { promisify } from "util";
import { DownloaderServicePort } from "../../../application/ports/DownloaderServicePort";
import { FileSystemServicePort } from "../../../application/ports/FileSystemServicePort";
import { NotificationServicePort } from "../../../application/ports/NotificationServicePort";

let ffmpegPathFinal = ffmpegPath ?? "";

// If app.asar is used, use app.asar.unpacked
if (ffmpegPathFinal.includes("app.asar")) {
  ffmpegPathFinal = ffmpegPathFinal.replace("app.asar", "app.asar.unpacked");
}

const execAsync = promisify(exec);

export class DownloaderServiceImpl implements DownloaderServicePort {
  constructor(
    private fileSystem: FileSystemServicePort,
    private notification: NotificationServicePort
  ) {}

  private getBinDir = (): string => {
    return fileSystemService.getExternalPath(path.join("resources", "lib"));
  };

  private getYtDlpPath = (): string => {
    const binDir = fileSystemService.getExternalPath(
      path.join("resources", "lib")
    );
    return path.join(
      binDir,
      process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
    );
  };

  private getDownloadURL(): string {
    if (process.platform === "win32")
      return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
    if (process.platform === "darwin")
      return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos";
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";
  }

  /**
   * Downloads yt-dlp and assigns execution permissions on macOS/Linux
   */
  async downloadYoutubeDownloader(): Promise<void> {
    const binDir = this.getBinDir();
    const ytDlpPath = this.getYtDlpPath();

    if (existsSync(ytDlpPath)) {
      console.log("[DepCheck]: yt-dlp is already in:", ytDlpPath);
      return;
    }

    if (!existsSync(binDir)) mkdirSync(binDir, { recursive: true });

    const url = this.getDownloadURL();

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

  public async searchVideos(
    query: string,
    numberOfResults: number
  ): Promise<MediaSearchResult[]> {
    const searchQuery = `"${this.getYtDlpPath()}" "ytsearch${
      numberOfResults > 0 ? numberOfResults : 1
    }:${query}" --dump-json --default-search ytsearch --no-playlist --no-check-certificate --geo-bypass --flat-playlist --skip-download --quiet --ignore-errors --ffmpeg-location ${ffmpegPathFinal}`;

    try {
      const { stdout } = await execAsync(searchQuery);

      if (!stdout) return [];

      // JSON parse
      const entries = stdout
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));

      return entries.map((entry: any) => ({
        id: entry.id,
        title: entry.title,
        url: entry.url,
        duration: entry.duration,
        thumbnail:
          entry.thumbnails && entry.thumbnails.length > 0
            ? entry.thumbnails[0].url
            : "",
      }));
    } catch (error) {
      console.error("Error executing yt-dlp:", error);
      return [];
    }
  }

  public async downloadVideo(
    url: string,
    downloadFolder: string,
    fileName: string
  ): Promise<void> {
    const folder = this.fileSystem.getExternalPath(downloadFolder);

    // Make sure the download path has a trailing slash
    const outputPath = path.join(folder, `${fileName}.webm`);

    // Remove if exists
    this.fileSystem.deleteFile(outputPath);

    // Prepare yt-dlp command
    const command = `"${this.getYtDlpPath()}" -f "bestvideo[ext=webm]+bestaudio[ext=webm]" -o "${outputPath}" ${url} -q --progress --force-overwrite --ffmpeg-location ${ffmpegPathFinal}`;

    this.downloadContent(command, fileName);
  }

  public async downloadAudio(
    url: string,
    downloadFolder: string,
    fileName: string
  ): Promise<void> {
    const folder = this.fileSystem.getExternalPath(downloadFolder);

    // Make sure the download path has a trailing slash
    const outputPath = path.join(folder, `${fileName}.opus`);

    // Remove if exists
    this.fileSystem.deleteFile(outputPath);

    // Prepare the yt-dlp command to download only the audio (the best audio available)
    const command = `"${this.getYtDlpPath()}" -f "bestaudio[ext=webm]" -o "${outputPath}" ${url} -q --progress --force-overwrite --ffmpeg-location ${ffmpegPathFinal}`;

    this.downloadContent(command, fileName);
  }

  private async downloadContent(command: string, fileName: string) {
    try {
      const process = spawn(command, {
        shell: true,
      });

      process.stdout.on("data", (data: Buffer) => {
        const output = data.toString();

        // Parse progress percentage from yt-dlp output
        const match = output.match(/(\d+(\.\d+)?)%/);
        if (match) {
          const progress = parseFloat(match[1]);

          // Generate message for WebSockets
          const message = {
            header: "DOWNLOAD_PROGRESS",
            body: String(progress),
          };

          // Send progress to the client
          this.notification.broadcast(JSON.stringify(message));
        }
      });

      process.stderr.on("data", (data: Buffer) => {
        console.error("Error:", data.toString());
      });

      process.on("close", (code: number) => {
        if (code === 0) {
          // Generate message for WebSockets
          const message = {
            header: "DOWNLOAD_COMPLETE",
            body: fileName,
          };

          // Send complete message to the client
          this.notification.broadcast(JSON.stringify(message));
        } else {
          // Generate message for WebSockets
          const message = {
            header: "DOWNLOAD_ERROR",
            body: code,
          };

          // Send error message to the client
          this.notification.broadcast(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error("Error executing yt-dlp:", error);
    }
  }
}
