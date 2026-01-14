import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import {
  fileSystemService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  AddLyricsDTO,
  SongResponse,
  UpdateSongDTO,
} from "../../../application/dtos/SongDTOs";

@Route("songs")
@Tags("Songs")
export class SongsController extends Controller {
  /**
   * Update song details
   */
  @Put("{id}")
  @Security("cookieAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateSongDTO
  ): Promise<SongResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.updateSong().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete a song
   */
  @Delete("{id}")
  @Security("cookieAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    await useCases.deleteSong().execute(id);

    return { message: messages.success.delete };
  }

  /**
   * Get song lyrics
   */
  @Get("{id}/lyrics")
  @Security("cookieAuth")
  public async getSongsLyrics(@Path() id: string): Promise<any> {
    if (!id) {
      throw new ApiError(400, "Song ID is required.");
    }
    return await MediaDetailsManager.findLyricsForSong(id);
  }

  /**
   * Add song lyrics
   */
  @Post("lyrics")
  @Security("cookieAuth")
  public async addSongsLyrics(@Body() body: AddLyricsDTO): Promise<any> {
    const { songId, language, content } = body;

    if (!songId || !language || !content) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    const song = await useCases.getSongById().execute(songId);

    if (!song) {
      throw new ApiError(404, messages.errors.notFound.song);
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

    return {
      message: "Lyrics file created successfully",
      path: fullSavePath,
    };
  }
}
