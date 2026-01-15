import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
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
  AddSongToPlaylistDTO,
  CreatePlayListDTO,
  PlayListResponse,
  UpdatePlayListDTO,
} from "../../../application/dtos/PlayListDTOs";

@Route("playlists")
@Tags("Playlists")
export class PlayListController extends Controller {
  /**
   * Get all playlists
   */
  @Get()
  @Security("adminAuth")
  public async getAll(): Promise<PlayListResponse> {
    const result = await useCases.getPlayLists().execute();

    return {
      status: "success",
      message: messages.success.fetch,
      data: result,
    };
  }

  /**
   * Get playlist by ID
   */
  @Get("{id}")
  @Security("adminAuth")
  public async getById(@Path() id: string): Promise<PlayListResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.getPlayListById().execute(id);

    if (!result) {
      throw new ApiError(404, "Playlist not found.");
    }

    return {
      status: "success",
      message: messages.success.fetch,
      data: result,
    };
  }

  /**
   * Create a new playlist
   */
  @Post()
  @Security("adminAuth")
  public async create(
    @Body() body: CreatePlayListDTO
  ): Promise<PlayListResponse> {
    const result = await useCases.createPlayList().execute(body);

    if (!result) {
      throw new ApiError(500, messages.errors.server.internal);
    }

    return {
      status: "success",
      message: messages.success.create,
      data: result,
    };
  }

  /**
   * Update playlist
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdatePlayListDTO
  ): Promise<PlayListResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.updatePlayList().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete playlist
   */
  @Delete("{id}")
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    await useCases.deletePlayList().execute(id);

    return { message: messages.success.delete };
  }

  /**
   * Add song to playlist
   */
  @Post("{id}/songs")
  @Security("adminAuth")
  public async addSong(
    @Path() id: string,
    @Body() body: AddSongToPlaylistDTO
  ): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const { songId } = body;

    if (!songId) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    await useCases.addSongToPlayList().execute(id, songId);

    return { message: messages.success.create };
  }

  /**
   * Remove song from playlist
   */
  @Delete("{id}/songs/{songId}")
  @Security("adminAuth")
  public async removeSong(
    @Path() id: string,
    @Path() songId: string
  ): Promise<MessageResponse> {
    if (!id || !songId) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    await useCases.removeSongFromPlayList().execute(id, songId);

    return { message: messages.success.delete };
  }
}
