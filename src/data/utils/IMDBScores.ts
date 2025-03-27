import axios from "axios";
import * as cheerio from "cheerio";

// Configurar un cliente de axios reutilizable
const axiosClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  timeout: 5000, // Timeout de 5 segundos para evitar esperas largas
});

export class IMDBScores {
  public static async getIMDBScore(imdbID: string): Promise<number> {
    try {
      const url = `https://www.imdb.com/title/${imdbID}/`;
      const { data } = await axiosClient.get(url);

      const $ = cheerio.load(data);
      const jsonLdScript = $('script[type="application/ld+json"]').html();

      // Avoid errors if jsonLdScript is null or undefined
      if (!jsonLdScript) {
        throw new Error("JSON-LD script not found");
      }

      const jsonData = JSON.parse(jsonLdScript);
      const rating = jsonData.aggregateRating?.ratingValue;

      if (typeof rating !== "number" && typeof rating !== "string") {
        throw new Error("Rating not found or invalid");
      }

      // Convert to number directly (handles comma or period depending on region)
      return Number(rating.toString().replace(",", "."));
    } catch (error: any) {
      console.error(`Error obtaining score for ${imdbID}:`, error.message);
      return -1;
    }
  }
}
