import getImagesRoutes from "@/api/v0/shared/infrastructure/web/routes/ImagesRoutes";
import getMediaInfoRoutes from "@/api/v0/shared/infrastructure/web/routes/MediaInfoRoutes";
import getAudioRoutes from "@/api/v0/songs/infrastructure/web/routes/AudioStreamingRoutes";
import videoStreamRoutes from "@/api/v0/videos/infrastructure/web/routes/VideoStreamRoutes";

import { Router } from "express";

const router = Router();

router.use("/", getAudioRoutes);
router.use("/", getImagesRoutes);
router.use("/", getMediaInfoRoutes);
router.use("/", videoStreamRoutes);

export default router;
