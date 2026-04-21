export interface IMDBScoreServicePort {
  getIMDBScore(imdbId: string): Promise<number>;
}
