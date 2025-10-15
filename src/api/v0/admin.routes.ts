import albumRoutes from "@/api/v0/albums/albums.routes";
import collectionRoutes from "@/api/v0/collections/collections.routes";
import episodeRoutes from "@/api/v0/episodes/episodes.routes";
import librariesRoutes from "@/api/v0/libraries/libraries.routes";
import moviesRoutes from "@/api/v0/movies/movies.routes";
import seasonsRoutes from "@/api/v0/seasons/seasons.routes";
import seriesRoutes from "@/api/v0/series/series.routes";
import serverRoutes from "@/api/v0/servers/servers.routes";
import songsRoutes from "@/api/v0/songs/songs.routes";
import videosRoutes from "@/api/v0/videos/videos.routes";
import postDataRoutes from "@/routes/data/post/postData";
import getServerSettings from "@/routes/data/settings/ServerSettings";
import folderRoutes from "@/routes/folders/folders";
import { Router } from "express";

const router = Router();

router.use("/", postDataRoutes);
router.use("/", getServerSettings);
router.use("/", folderRoutes);
router.use("/", videosRoutes);
router.use("/", songsRoutes);
router.use("/", serverRoutes);
router.use("/", seriesRoutes);
router.use("/", seasonsRoutes);
router.use("/", moviesRoutes);
router.use("/", librariesRoutes);
router.use("/", episodeRoutes);
router.use("/", collectionRoutes);
router.use("/", albumRoutes);

export default router;
