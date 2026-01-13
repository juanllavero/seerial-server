import { Router } from "express";
import { ArtistsController } from "../controllers/ArtistsController";

const router = Router();

// POST /artists - Create artist
router.post("/", ArtistsController.create);

// GET /artists/:id - Get artist by ID
router.get("/:id", ArtistsController.getById);

// PUT /artists/:id - Update artist
router.put("/:id", ArtistsController.update);

// DELETE /artists/:id - Delete artist
router.delete("/:id", ArtistsController.delete);

export default router;
