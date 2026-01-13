import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";
import { MovieDb } from "moviedb-promise";
import propertiesReader from "properties-reader";
import { fileSystemService, tmdbApiClient } from "../../adapters/di/container";

const router = Router();

/**
 * @swagger
 * /configuration/api-key:
 *   post:
 *     summary: Set and validate TMDB API key
 *     tags: [API Configuration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: TMDB API key to validate and save
 *                 example: "your_tmdb_api_key_here"
 *     responses:
 *       200:
 *         description: API key validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [VALID_API_KEY, INVALID_API_KEY]
 *                   example: VALID_API_KEY
 *       400:
 *         description: Missing or invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: INVALID_API_KEY
 *       500:
 *         description: Server error during API key validation
 */
router.post(
  "/configuration/api-key",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { apiKey } = req.body;

    const properties =
      propertiesReader(fileSystemService.propertiesFilePath) || undefined;

    // Save API key in properties file
    properties.set("TMDB_API_KEY", apiKey);
    properties.save(fileSystemService.propertiesFilePath);

    if (!apiKey) {
      return res.status(400).json({
        status: "INVALID_API_KEY",
      });
    }

    const moviedb = new MovieDb(String(apiKey));

    tmdbApiClient.THEMOVIEDB_API_TOKEN = apiKey;

    return res.status(200).json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  })
);

export default router;
