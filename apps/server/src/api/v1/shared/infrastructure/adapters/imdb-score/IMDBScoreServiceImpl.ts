import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '@/utils/logger';
import type { IMDBScoreServicePort } from '../../../application/ports/IMDBScoreServicePort';

const imdbLogger = logger.child({ category: 'IMDB Score' });

const parseRatingValue = (value: unknown): number | null => {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value.toString().replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const findRatingInNode = (node: unknown): number | null => {
  if (!node || typeof node !== 'object') {
    return null;
  }

  const maybeAggregateRating = (node as { aggregateRating?: { ratingValue?: unknown } })
    .aggregateRating;
  const directRating = parseRatingValue(maybeAggregateRating?.ratingValue);
  if (directRating !== null) {
    return directRating;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const rating = findRatingInNode(item);
      if (rating !== null) {
        return rating;
      }
    }
    return null;
  }

  const graph = (node as { '@graph'?: unknown })['@graph'];
  if (graph) {
    return findRatingInNode(graph);
  }

  for (const value of Object.values(node as Record<string, unknown>)) {
    const nestedRating = findRatingInNode(value);
    if (nestedRating !== null) {
      return nestedRating;
    }
  }

  return null;
};

export class IMDBScoreServiceImpl implements IMDBScoreServicePort {
  axiosClient = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    timeout: 5000, // 5s timeout to avoid long waits
  });

  async getIMDBScore(imdbID: string): Promise<number> {
    try {
      const url = `https://www.imdb.com/title/${imdbID}/`;
      const { data } = await this.axiosClient.get(url);

      const $ = cheerio.load(data);
      const scripts = $('script[type="application/ld+json"]')
        .toArray()
        .map((script) => $(script).html())
        .filter((content): content is string => Boolean(content));

      if (scripts.length === 0) {
        throw new Error('JSON-LD script not found');
      }

      for (const jsonLdScript of scripts) {
        try {
          const jsonData = JSON.parse(jsonLdScript);
          const rating = findRatingInNode(jsonData);
          if (rating !== null) {
            return rating;
          }
        } catch {
          // Skip malformed JSON-LD blocks and continue.
        }
      }

      throw new Error('Rating not found or invalid');
    } catch (error: unknown) {
      imdbLogger.error(error, `Error obtaining score for ${imdbID}`);
      return -1;
    }
  }
}
