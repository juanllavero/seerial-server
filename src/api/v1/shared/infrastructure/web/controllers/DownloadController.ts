import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { DownloaderManager } from "@/managers/DownloaderManager";
import { downloadImage, isValidURL } from "@/utils/utils";
import path from "path";
import { Body, Controller, Post, Route, Security, Tags } from "tsoa";
import { MessageResponse } from "../../../application/dtos/DTOs";
import { fileSystemService } from "../../adapters/di/container";

interface DownloadVideoDTO {
  url: string;
  downloadFolder: string;
  fileName: string;
}

interface DownloadMusicDTO {
  url: string;
  downloadFolder: string;
  fileName: string;
}

interface DownloadImageDTO {
  url: string;
  downloadFolder: string;
  fileName: string;
}

@Route("downloads")
@Tags("Downloads")
export class DownloadController extends Controller {
  /**
   * Download video file
   */
  @Post("video")
  @Security("adminAuth")
  public async downloadVideo(
    @Body() body: DownloadVideoDTO
  ): Promise<MessageResponse> {
    const { url, downloadFolder, fileName } = body;

    await DownloaderManager.downloadVideo(url, downloadFolder, fileName);

    return { message: messages.success.download };
  }

  /**
   * Download music file
   */
  @Post("music")
  @Security("adminAuth")
  public async downloadMusic(
    @Body() body: DownloadMusicDTO
  ): Promise<MessageResponse> {
    const { url, downloadFolder, fileName } = body;

    await DownloaderManager.downloadAudio(url, downloadFolder, fileName);

    return { message: messages.success.download };
  }

  /**
   * Download image file
   */
  @Post("image")
  @Security("adminAuth")
  public async downloadImage(
    @Body() body: DownloadImageDTO
  ): Promise<MessageResponse> {
    let { url, downloadFolder, fileName } = body;

    if (!isValidURL(url)) {
      throw new ApiError(400, messages.errors.validation.invalidData);
    }

    // If the file name doesn't have an extension, add .jpg
    if (!path.extname(fileName)) {
      fileName += ".jpg";
    }

    await downloadImage(
      url,
      path.join(fileSystemService.resourcesPath, downloadFolder, fileName)
    );

    return { message: messages.success.download };
  }
}
