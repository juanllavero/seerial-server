import {
  audioProcessingService,
  fileSystemService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { MediaDetailsService } from "@/api/v1/shared/infrastructure/services/MediaDetailsService";
import { NotFoundException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { ApiResponse } from "@/api/v1/shared/infrastructure/web/http/APIResponse";
import { messages } from "@/config/messages";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  AddLyricsDTO,
  UpdateSongDTO,
} from "../../../application/dtos/SongDTOs";
import { Song } from "../../../domain/Song";

@Route("songs")
@Tags("Songs")
export class SongsController extends Controller {
  /**
   * Update song details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateSongDTO
  ): Promise<ApiResponse<Song>> {
    const result = await useCases.updateSong().execute(id, body);
    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete a song
   */
  @Delete("{id}")
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteSong().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Get song lyrics
   */
  @Get("{id}/lyrics")
  @Security("adminAuth")
  public async getSongsLyrics(
    @Path() id: string
  ): Promise<ApiResponse<{ content: string; language: string }[]>> {
    const result = await MediaDetailsService.findLyricsForSong(id);
    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Add song lyrics
   */
  @Post("lyrics")
  @Security("adminAuth")
  public async addSongsLyrics(
    @Body() body: AddLyricsDTO
  ): Promise<ApiResponse<string>> {
    const { songId, language, content } = body;

    const song = await useCases.getSongById().execute(songId);

    if (!song) {
      throw new NotFoundException(messages.errors.notFound.song);
    }

    const songDirectory = fileSystemService.dirname(song.fileSrc);
    const baseFilename = fileSystemService.basename(
      song.fileSrc,
      fileSystemService.extname(song.fileSrc)
    );

    // If original language, avoid adding the language code to the file name
    const languageSuffix =
      language.toLowerCase() === "original" || language === ""
        ? ""
        : `.${language}`;

    const finalFilename = `${baseFilename}${languageSuffix}.lrc`;
    const fullSavePath = fileSystemService.join(songDirectory, finalFilename);

    await fileSystemService.writeFile(fullSavePath, content, "utf-8");
    return ApiResponse.success(finalFilename, messages.success.create);
  }

  /**
   * Stream audio file
   */
  @Get("stream")
  @Security("adminAuth")
  public async streamAudio(
    @Query() path: string,
    @Query() isWeb?: string
  ): Promise<void> {
    const audioPath = path;
    const isWebBool = isWeb === "true";

    // Get file path
    const streamablePath = await audioProcessingService.getStreamableAudioPath(
      decodeURIComponent(audioPath),
      isWebBool
    );

    // Stream the file
    audioProcessingService.streamFile(
      streamablePath,
      (this as any).request,
      (this as any).response
    );
  }
}
