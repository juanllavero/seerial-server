import type { LyricsLine } from '@seerial/domain';
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
  SuccessResponse,
  Tags,
} from 'tsoa';
import {
  audioProcessingService,
  fileSystemService,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { findLyricsForSong } from '@/api/v1/shared/infrastructure/services/MediaDetailsService';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import { verifyAudioStreamToken } from '@/middleware/audio.middleware';
import type {
  SeparateSongStemsResponseDTO,
  SongUrlDTO,
  UpdateSongDTO,
} from '../../../application/dtos/SongDTOs';
import type { Song } from '../../../domain/Song';

type AuthenticatedRequest = ExpressRequest & { user?: { id?: string } };

@Route('songs')
@Tags('Songs')
export class SongsController extends Controller {
  private async resolveSongPath(filePath: string, localId?: string): Promise<string | null> {
    if (!localId) {
      return filePath || null;
    }

    const localFolder = fileSystemService.getExternalPath(
      fileSystemService.join('resources', 'music', localId),
    );

    if (!(await fileSystemService.isFolder(localFolder))) {
      return null;
    }

    const [resolvedPath] = await fileSystemService.getValidMusicFiles(localFolder);

    return resolvedPath ?? null;
  }

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
   * Start asynchronous stem separation for a song.
   */
  @Post('{id}/separate-stems')
  @Security('adminAuth')
  @SuccessResponse('202', 'Accepted')
  public async separateStems(
    @Path() id: string,
  ): Promise<ApiResponse<SeparateSongStemsResponseDTO>> {
    const result = await useCases.startSongStemSeparation().execute(id);
    this.setStatus(202);
    return ApiResponse.success(result, messages.success.processStarted);
  }

  /**
   * Get song lyrics
   */
  @Get('{id}/lyrics')
  @Security('adminAuth')
  public async getSongsLyrics(@Path() id: string): Promise<ApiResponse<LyricsLine[]>> {
    const result = await findLyricsForSong(id);
    return ApiResponse.success(result, messages.success.fetch);
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
  ): Promise<ApiResponse<string | null>> {
    const userId = (req as AuthenticatedRequest | undefined)?.user?.id as string;
    const { filePath, localId, expiresIn } = body;

    const path = await this.resolveSongPath(filePath, localId);

    if (!path) {
      return ApiResponse.success(null, messages.success.fetch);
    }

    const token = jwt.sign(
      {
        userId,
        path,
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
