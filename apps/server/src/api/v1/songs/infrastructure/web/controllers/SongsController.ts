import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import jwt from 'jsonwebtoken';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from 'tsoa';
import {
  audioProcessingService,
  fileSystemService,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { findLyricsForSong } from '@/api/v1/shared/infrastructure/services/MediaDetailsService';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import { verifyAudioStreamToken } from '@/middleware/audio.middleware';
import type { AddLyricsDTO, SongUrlDTO, UpdateSongDTO } from '../../../application/dtos/SongDTOs';
import type { Song } from '../../../domain/Song';

type AuthenticatedRequest = ExpressRequest & { user?: { id?: string } };

@Route('songs')
@Tags('Songs')
export class SongsController extends Controller {
  /**
   * Update song details
   */
  @Patch('{id}')
  @Security('adminAuth')
  public async update(@Path() id: string, @Body() body: UpdateSongDTO): Promise<ApiResponse<Song>> {
    const result = await useCases.updateSong().execute(id, body);
    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete a song
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteSong().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Get song lyrics
   */
  @Get('{id}/lyrics')
  @Security('adminAuth')
  public async getSongsLyrics(
    @Path() id: string,
  ): Promise<ApiResponse<{ content: string; language: string }[]>> {
    const result = await findLyricsForSong(id);
    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Add song lyrics
   */
  @Post('lyrics')
  @Security('adminAuth')
  public async addSongsLyrics(@Body() body: AddLyricsDTO): Promise<ApiResponse<string>> {
    const { songId, language, content } = body;

    const song = await useCases.getSongById().execute(songId);

    if (!song) {
      throw new NotFoundException(messages.errors.notFound.song);
    }

    const songDirectory = fileSystemService.dirname(song.fileSrc);
    const baseFilename = fileSystemService.basename(
      song.fileSrc,
      fileSystemService.extname(song.fileSrc),
    );

    // If original language, avoid adding the language code to the file name
    const languageSuffix =
      language.toLowerCase() === 'original' || language === '' ? '' : `.${language}`;

    const finalFilename = `${baseFilename}${languageSuffix}.lrc`;
    const fullSavePath = fileSystemService.join(songDirectory, finalFilename);

    await fileSystemService.writeFile(fullSavePath, content, 'utf-8');
    return ApiResponse.success(finalFilename, messages.success.create);
  }

  /**
   * Generate a JWT-signed URL for direct song streaming
   */
  @Post('stream-url')
  @Security('cookieAuth')
  public async getSongUrl(
    @Body() body: SongUrlDTO,
    @Query() isWeb?: string,
    @Query() isDesktop?: string,
    @Query() isMobile?: string,
    @Request() req?: ExpressRequest,
  ): Promise<ApiResponse<string>> {
    const userId = (req as AuthenticatedRequest | undefined)?.user?.id as string;
    const { filePath, expiresIn } = body;

    const token = jwt.sign(
      {
        userId,
        path: filePath,
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: (expiresIn ?? '2m') as jwt.SignOptions['expiresIn'] },
    );

    const params = new URLSearchParams({ token });
    if (isWeb) {
      params.set('isWeb', isWeb);
    }
    if (isDesktop) {
      params.set('isDesktop', isDesktop);
    }
    if (isMobile) {
      params.set('isMobile', isMobile);
    }

    const url = `/songs/stream?${params.toString()}`;

    return ApiResponse.success(url, messages.success.fetch);
  }

  /**
   * Stream audio file
   */
  @Get('stream')
  public async streamAudio(@Request() req: ExpressRequest, @Query() isWeb?: string): Promise<void> {
    const res = req.res as ExpressResponse;

    await new Promise<void>((resolve, reject) => {
      verifyAudioStreamToken(req, res, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const audioPath = req.audioParams?.path ?? '';
    const isWebBool = isWeb === 'true';

    // Get file path
    const streamablePath = await audioProcessingService.getStreamableAudioPath(
      decodeURIComponent(audioPath),
      isWebBool,
    );

    // Stream the file
    audioProcessingService.streamFile(streamablePath, req, res);
  }
}
