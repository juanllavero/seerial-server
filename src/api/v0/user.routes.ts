import collectionRoutes from "@/api/v0/collections/infrastructure/web/routes/CollectionsPublicRoutes";
import continueWatchingRoutes from "@/api/v0/continue-watching/infrastructure/web/routes/ContinueWatchingRoutes";
import librariesRoutes from "@/api/v0/libraries/infrastructure/web/routes/LibrariesPublicRoutes";
import mylistRoutes from "@/api/v0/my-lists/infrastructure/web/routes/MyListRoutes";
import getMediaRoutes from "@/api/v0/shared/infrastructure/web/routes/GetFilesRoutes";
import watchlistRoutes from "@/api/v0/watch-lists/infrastructure/web/routes/WatchListPublicRoutes";
import { Router } from "express";

const router = Router();

router.use("/", getMediaRoutes);
router.use("/", watchlistRoutes);
router.use("/", mylistRoutes);
router.use("/", librariesRoutes);
router.use("/", continueWatchingRoutes);
router.use("/", collectionRoutes);

export default router;
