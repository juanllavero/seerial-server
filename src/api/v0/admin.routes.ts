import albumRoutes from "@/api/v0/albums/infrastructure/web/routes/AlbumsRoutes";
import collectionRoutes from "@/api/v0/collections/infrastructure/web/routes/CollectionsRoutes";
import episodeRoutes from "@/api/v0/episodes/infrastructure/web/routes/EpisodesRoutes";
import librariesRoutes from "@/api/v0/libraries/infrastructure/web/routes/LibrariesRoutes";
import seasonsRoutes from "@/api/v0/seasons/infrastructure/web/routes/SeasonsRoutes";
import seriesRoutes from "@/api/v0/series/infrastructure/web/routes/SeriesRoutes";
import getServerSettings from "@/api/v0/servers/infrastructure/web/routes/ServerConfigRoutes";
import serverRoutes from "@/api/v0/servers/infrastructure/web/routes/ServersRoutes";
import apiKeyRoutes from "@/api/v0/shared/infrastructure/web/routes/APIKeyRoutes";
import downloadRoutes from "@/api/v0/shared/infrastructure/web/routes/DownloadRoutes";
import getFilesRoutes from "@/api/v0/shared/infrastructure/web/routes/GetFilesRoutes";
import sharedRoutes from "@/api/v0/shared/infrastructure/web/routes/SharedRoutes";
import songsRoutes from "@/api/v0/songs/infrastructure/web/routes/SongsRoutes";
import videosRoutes from "@/api/v0/videos/infrastructure/web/routes/VideosRoutes";
import { Router } from "express";

const router = Router();

router.use("/", getServerSettings);
router.use("/", videosRoutes);
router.use("/", songsRoutes);
router.use("/", serverRoutes);
router.use("/", seriesRoutes);
router.use("/", seasonsRoutes);
router.use("/", librariesRoutes);
router.use("/", episodeRoutes);
router.use("/", collectionRoutes);
router.use("/", albumRoutes);
router.use("/", sharedRoutes);
router.use("/", getFilesRoutes);
router.use("/", apiKeyRoutes);
router.use("/", downloadRoutes);

export default router;
