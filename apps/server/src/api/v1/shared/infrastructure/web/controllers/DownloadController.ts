import path from 'node:path';
import { Body, Controller, Post, Route, Security, Tags } from 'tsoa';
import { messages } from '@/config/messages';
import { downloadImage, isValidURL } from '@/utils/utils';
import { downloaderService, fileSystemService } from '../../adapters/di/container';
import { BadRequestException } from '../exceptions/HTTPExceptions';
import { ApiResponse } from '../http/APIResponse';

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

@Route('downloads')
@Tags('Downloads')
export class DownloadController extends Controller {
  /**
   * Download video file
   */
  @Post('video')
  @Security('adminAuth')
  public async downloadVideo(@Body() body: DownloadVideoDTO): Promise<ApiResponse<null>> {
    const { url, downloadFolder, fileName } = body;

    await downloaderService.downloadVideo(url, downloadFolder, fileName);
    return ApiResponse.success(null, messages.success.download);
  }

  /**
   * Download music file
   */
  @Post('music')
  @Security('adminAuth')
  public async downloadMusic(@Body() body: DownloadMusicDTO): Promise<ApiResponse<null>> {
    const { url, downloadFolder, fileName } = body;

    await downloaderService.downloadAudio(url, downloadFolder, fileName);
    return ApiResponse.success(null, messages.success.download);
  }

  /**
   * Download image file
   */
  @Post('image')
  @Security('adminAuth')
  public async downloadImage(@Body() body: DownloadImageDTO): Promise<ApiResponse<null>> {
    let { url, downloadFolder, fileName } = body;

    if (!isValidURL(url)) {
      throw new BadRequestException(messages.errors.validation.invalidData);
    }

    // If the file name doesn't have an extension, add .jpg
    if (!path.extname(fileName)) {
      fileName += '.jpg';
    }

    await downloadImage(url, path.join(fileSystemService.resourcesPath, downloadFolder, fileName));

    return ApiResponse.success(null, messages.success.download);
  }
}
