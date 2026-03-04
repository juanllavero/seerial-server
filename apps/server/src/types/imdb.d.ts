declare module "@skymansion/imdb" {
  class IMDb {
    private baseUrl: string;

    /**
     * Creates a new instance of the IMDb class
     */
    constructor();

    /**
     * Searches for movies or TV shows on IMDb based on the provided name, year, and type
     * @param name The title of the movie or TV show
     * @param year The release year of the movie or TV show (optional)
     * @param type The type of content to search for ('movie' or 'tvSeries')
     * @returns A Promise resolving to the best matching result or null if no match found
     */
    search(
      name: string,
      year?: number,
      type: "movie" | "tvSeries"
    ): Promise<{
      title: string;
      id: string;
      type: "movie" | "tvSeries";
      year: number | "Unknown";
      cast: string;
      image: string;
      matchConfidence: number;
    } | null>;

    /**
     * Fetches search results from IMDb
     * @param query The search query
     * @returns A Promise resolving to an array of search results
     */
    fetchResults(query: string): Promise<any[]>;

    /**
     * Finds the best matching result from search results
     * @param results Array of search results
     * @param originalName The original search name
     * @param targetYear The target year (optional)
     * @param targetType The target content type
     * @returns The best matching result or null
     */
    findBestMatch(
      results: any[],
      originalName: string,
      targetYear: number | undefined,
      targetType: "movie" | "tvSeries"
    ): any | null;

    /**
     * Calculates a match score for a search result
     * @param item The search result item
     * @param originalName The original search name
     * @param targetYear The target year
     * @param targetType The target content type
     * @returns A numeric score representing the match quality
     */
    calculateMatchScore(
      item: any,
      originalName: string,
      targetYear: number | undefined,
      targetType: "movie" | "tvSeries"
    ): number;

    /**
     * Formats a search result into the standard return format
     * @param result The raw search result
     * @returns Formatted result object or null
     */
    ReturnResult(result: any): {
      title: string;
      id: string;
      type: "movie" | "tvSeries";
      year: number | "Unknown";
      cast: string;
      image: string;
      matchConfidence: number;
    } | null;

    /**
     * Retrieves detailed information about a movie or TV show from IMDb
     * @param movieId The IMDb ID of the content
     * @param Confidence The match confidence score
     * @returns A Promise resolving to detailed content information
     */
    getIMDbMovieDetails(
      movieId: string,
      Confidence: number
    ): Promise<{
      title: string;
      img: string;
      description: string;
      language?: string;
      genre: string;
      datePublished: string;
      rating?: string;
      duration: string;
      actors: string;
      director?: string;
      CorrectConfidence: number;
    }>;

    /**
     * Searches for a movie and retrieves detailed information about it
     * @param name The title of the movie
     * @param year The release year of the movie (optional)
     * @returns A Promise resolving to detailed movie information or 'data not found'
     */
    getMovieData(
      name: string,
      year?: number
    ): Promise<
      | {
          title: string;
          img: string;
          description: string;
          language?: string;
          genre: string;
          datePublished: string;
          rating?: string;
          duration: string;
          actors: string;
          director?: string;
          CorrectConfidence: number;
        }
      | "data not found"
    >;

    /**
     * Searches for a TV show and retrieves detailed information about it
     * @param name The title of the TV show
     * @param year The release year of the first episode (optional)
     * @returns A Promise resolving to detailed TV show information or 'data not found'
     */
    getTvShowData(
      name: string,
      year?: number
    ): Promise<
      | {
          title: string;
          img: string;
          description: string;
          language?: string;
          genre: string;
          datePublished: string;
          rating?: string;
          duration: string;
          actors: string;
          director?: string;
          CorrectConfidence: number;
        }
      | "data not found"
    >;
  }

  export = IMDb;
}
