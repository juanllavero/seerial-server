import { getMediaInfo } from "@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { Video } from "../../domain/Video";
import { VideoRepositoryPort } from "../ports/VideosRepositoryPort";

export class UpdateMediaInfoUseCase {
  constructor(private videoRepo: VideoRepositoryPort) {}

  async execute(id: string): Promise<Video> {
    const video = await this.videoRepo.findById(id);

    if (!video) {
      throw new ApiError(400, messages.errors.notFound.video);
    }

    const mediaInfo = await getMediaInfo(video.fileSrc);

    if (!mediaInfo) {
      throw new ApiError(400, messages.errors.notFound.mediaInfo);
    }

    video.mediaInfo = mediaInfo.mediaInfo;
    video.videoTracks = mediaInfo.videoTracks;
    video.subtitleTracks = mediaInfo.subtitleTracks;
    video.audioTracks = mediaInfo.audioTracks;
    video.chapters = mediaInfo.chapters;
    video.runtime = mediaInfo.duration;

    return await this.videoRepo.update(video.id, video);
  }
}
