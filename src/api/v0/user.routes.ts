import collectionRoutes from "@/api/v0/collections/collections.routes.public";
import continueWatchingRoutes from "@/api/v0/continue-watching/continue-watching.routes.public";
import librariesRoutes from "@/api/v0/libraries/libraries.routes.public";
import mylistRoutes from "@/api/v0/my-lists/my-lists.routes.public";
import videosRoutes from "@/api/v0/videos/videos.routes.public";
import watchlistRoutes from "@/api/v0/watch-lists/watch-lists.routes.public";
import getMediaRoutes from "@/routes/data/get/getMedia";
import publicPostRoutes from "@/routes/data/post/publicPost";
import { Router } from "express";

const router = Router();

router.use("/", getMediaRoutes);
router.use("/", publicPostRoutes);
router.use("/", watchlistRoutes);
router.use("/", videosRoutes);
router.use("/", mylistRoutes);
router.use("/", librariesRoutes);
router.use("/", continueWatchingRoutes);
router.use("/", collectionRoutes);

export default router;
