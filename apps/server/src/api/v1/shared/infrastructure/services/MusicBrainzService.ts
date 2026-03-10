import { APP_NAME, APP_VERSION } from '@/utils/constants';
import logger from '@/utils/logger';

const musicBrainzLogger = logger.child({ category: 'MusicBrainz' });

interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
  'release-group'?: {
    id: string;
    'primary-type'?: string;
  };
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  length?: number; // milliseconds
  position?: number;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
}

interface MusicBrainzReleaseDetail {
  id: string;
  title: string;
  date?: string;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
  annotation: string;
  media?: Array<{
    position: number;
    'track-count': number;
    tracks?: MusicBrainzRecording[];
  }>;
}

interface MusicBrainzSearchResult {
  releases?: MusicBrainzRelease[];
}

export interface AlbumMetadata {
  mbid: string;
  title: string;
  artist: string;
  artistMbid: string;
  releaseDate?: string;
  coverArtUrl?: string;
  annotation: string;
  tracks: TrackMetadata[];
}

export interface TrackMetadata {
  title: string;
  position: number;
  duration?: number; // seconds
  artists: string[];
  discNumber: number;
}

export class MusicBrainzService {
  private readonly baseUrl = 'https://musicbrainz.org/ws/2';
  private readonly coverArtUrl = 'https://coverartarchive.org/release';
  private readonly userAgent = `${APP_NAME}/${APP_VERSION} ( app.seerial@gmail.com )`;
  private lastRequestTime = 0;
  private readonly rateLimit = 1000; // 1 request per second

  /**
   * Rate limiter to respect MusicBrainz's 1 req/sec policy
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimit) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimit - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Makes a request to MusicBrainz API
   */
  private async makeRequest<T>(url: string): Promise<T | null> {
    await this.waitForRateLimit();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        musicBrainzLogger.warn({ status: response.status, url }, 'MusicBrainz API request failed');
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      musicBrainzLogger.error({ error, url }, 'Error making MusicBrainz request');
      return null;
    }
  }

  /**
   * Searches for releases by album name and artist
   */
  async searchRelease(albumName: string, artistName: string): Promise<AlbumMetadata | null> {
    const query = `release:"${albumName}" AND artist:"${artistName}"`;
    const url = `${this.baseUrl}/release/?query=${encodeURIComponent(query)}&limit=1&fmt=json`;

    const result = await this.makeRequest<MusicBrainzSearchResult>(url);

    if (!result?.releases || result.releases.length === 0) {
      musicBrainzLogger.info({ albumName, artistName }, 'No releases found in MusicBrainz');
      return null;
    }

    const release = result.releases[0];
    return await this.getReleaseDetails(release.id);
  }

  /**
   * Gets detailed information about a release including tracks
   */
  async getReleaseDetails(mbid: string): Promise<AlbumMetadata | null> {
    const url = `${this.baseUrl}/release/${mbid}?inc=artist-credits+recordings+annotation&fmt=json`;

    const release = await this.makeRequest<MusicBrainzReleaseDetail>(url);

    if (!release) {
      musicBrainzLogger.warn({ mbid }, 'Failed to get release details');
      return null;
    }

    const artistCredit = release['artist-credit']?.[0];
    const artist = artistCredit?.artist?.name || artistCredit?.name || 'Unknown Artist';
    const artistMbid = artistCredit?.artist?.id || '';

    // Extract tracks from all media (discs)
    const tracks: TrackMetadata[] = [];

    if (release.media) {
      for (const media of release.media) {
        const discNumber = media.position;

        if (media.tracks) {
          for (const track of media.tracks) {
            const trackArtists = track['artist-credit']?.map(
              (ac) => ac.artist?.name || ac.name,
            ) || [artist];

            tracks.push({
              title: track.title,
              position: track.position || 0,
              duration: track.length ? Math.round(track.length / 1000) : undefined,
              artists: trackArtists,
              discNumber,
            });
          }
        }
      }
    }

    // Get cover art
    const coverArtUrl = await this.getCoverArt(mbid);

    return {
      mbid,
      title: release.title,
      artist,
      artistMbid,
      releaseDate: release.date,
      annotation: release.annotation || '',
      coverArtUrl,
      tracks,
    };
  }

  /**
   * Gets cover art URL from Cover Art Archive
   */
  async getCoverArt(mbid: string): Promise<string | undefined> {
    const url = `${this.coverArtUrl}/${mbid}`;

    await this.waitForRateLimit();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return undefined;
      }

      const data = (await response.json()) as any;

      // Get front cover image
      const frontImage = data.images?.find((img: any) => img.front === true);

      return frontImage?.image || data.images?.[0]?.image;
    } catch (error) {
      musicBrainzLogger.warn({ error, mbid }, 'Failed to fetch cover art');
      return undefined;
    }
  }

  /**
   * Downloads cover art image and returns buffer
   */
  async downloadCoverArt(url: string): Promise<Buffer | null> {
    await this.waitForRateLimit();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      musicBrainzLogger.error({ error, url }, 'Error downloading cover art');
      return null;
    }
  }

  /**
   * Searches for artist by name
   */
  async searchArtist(artistName: string): Promise<string | null> {
    const query = `artist:"${artistName}"`;
    const url = `${this.baseUrl}/artist/?query=${encodeURIComponent(query)}&limit=1&fmt=json`;

    const result = await this.makeRequest<{
      artists?: Array<{ id: string; name: string }>;
    }>(url);

    if (!result?.artists || result.artists.length === 0) {
      return null;
    }

    return result.artists[0].id;
  }
}
