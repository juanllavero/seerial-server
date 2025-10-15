import getAudioRoutes from "@/routes/data/get/getAudio";
import getColorsRoutes from "@/routes/data/get/getColors";
import getImagesRoutes from "@/routes/data/get/getImages";
import getMediaInfoRoutes from "@/routes/data/get/getMediaInfo";
import getVideoRoutes from "@/routes/data/get/getVideo";
import { Router } from "express";

const router = Router();

router.use("/", getAudioRoutes);
router.use("/", getColorsRoutes);
router.use("/", getImagesRoutes);
router.use("/", getMediaInfoRoutes);
router.use("/", getVideoRoutes);

export default router;
