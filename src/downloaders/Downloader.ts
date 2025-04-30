import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { WebSocketManager } from "../WebSockets/WebSocketManager";
import { MediaSearchResult } from "../data/interfaces/SearchResults";
import { FilesManager } from "../utils/FilesManager";

const execAsync = promisify(exec);

export class Downloader {
  public static async searchVideos(
    query: string,
    numberOfResults: number
  ): Promise<MediaSearchResult[]> {
    // Get the absolute path of yt-dlp.exe based on the current directory
    const ytDlpPath = FilesManager.getInternalPath("lib/yt-dlp.exe");

    const searchQuery = `${ytDlpPath} "ytsearch${
      numberOfResults > 0 ? numberOfResults : 1
    }:${query}" --dump-json --default-search ytsearch --no-playlist --no-check-certificate --geo-bypass --flat-playlist --skip-download --quiet --ignore-errors`;

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

  public static async downloadVideo(
    url: string,
    downloadFolder: string,
    fileName: string,
    wsManager: WebSocketManager
  ): Promise<void> {
    // Get the absolute path of yt-dlp.exe based on the current directory
    const ytDlpPath = FilesManager.getInternalPath("lib/yt-dlp.exe"); // Change

    const folder = FilesManager.getExternalPath(downloadFolder);

    // Make sure the download path has a trailing slash
    const outputPath = path.join(folder, `${fileName}.webm`);

    // Remove if exists
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (error) {
        console.error("File not removed: ", outputPath);
      }
    }

    // Prepare yt-dlp command
    const command = `${ytDlpPath} -f "bestvideo[ext=webm]+bestaudio[ext=webm]" -o "${outputPath}" ${url} -q --progress --force-overwrite`;

    this.downloadContent(command, fileName, wsManager);
  }

  public static async downloadAudio(
    url: string,
    downloadFolder: string,
    fileName: string,
    wsManager: WebSocketManager
  ): Promise<void> {
    // Get the absolute path of yt-dlp.exe based on the current directory
    const ytDlpPath = FilesManager.getInternalPath("lib/yt-dlp.exe");

    // Make sure the download path has a trailing slash
    const outputPath = path.join(downloadFolder, `${fileName}.opus`);

    // Remove if exists
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (error) {
        console.error("File not removed: ", outputPath);
      }
    }

    // Prepare the yt-dlp command to download only the audio (the best audio available)
    const command = `${ytDlpPath} -f "bestaudio[ext=webm]" -o "${outputPath}" ${url} -q --progress --force-overwrite`;

    this.downloadContent(command, fileName, wsManager);
  }

  private static async downloadContent(
    command: string,
    fileName: string,
    wsManager: WebSocketManager
  ) {
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
          wsManager.broadcast(JSON.stringify(message));
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
          wsManager.broadcast(JSON.stringify(message));
        } else {
          // Generate message for WebSockets
          const message = {
            header: "DOWNLOAD_ERROR",
            body: code,
          };

          // Send error message to the client
          wsManager.broadcast(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error("Error executing yt-dlp:", error);
    }
  }
}
