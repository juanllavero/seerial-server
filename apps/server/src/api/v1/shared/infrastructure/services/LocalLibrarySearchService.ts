import type { LibrarySearchItem, LibraryType } from '@seerial/domain';
import { AlbumModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumModel';
import { ArtistModel } from '@/api/v1/artists/infrastructure/persistence/models/ArtistModel';
import { CollectionModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionModel';
import { EpisodeModel } from '@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { DatabaseManager } from '@/api/v1/shared/infrastructure/persistence/DatabaseManager';
import { SongModel } from '@/api/v1/songs/infrastructure/persistence/models/SongModel';

const DEFAULT_LIMIT_PER_TYPE = 12;
const MAX_LIMIT_PER_TYPE = 30;

function normalizeQuery(value: string): string {
    return value.trim().toLowerCase();
}

function toLikeQuery(value: string): string {
    return `%${normalizeQuery(value)}%`;
}

function getSafeLimit(limit?: number): number {
    if (typeof limit !== 'number' || Number.isNaN(limit) || limit <= 0) {
        return DEFAULT_LIMIT_PER_TYPE;
    }

    return Math.min(Math.floor(limit), MAX_LIMIT_PER_TYPE);
}

function sortByTitle<T extends LibrarySearchItem>(items: T[]): T[] {
    return items.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}

function uniqueArtistNames(values: string[]): string {
    return Array.from(new Set(values.filter(Boolean))).join(', ');
}

type ArtistSearchItem = Extract<LibrarySearchItem, { type: 'artist' }>;

export class LocalLibrarySearchService {
    public async search(query: string, limitPerType?: number): Promise<LibrarySearchItem[]> {
        const normalizedQuery = normalizeQuery(query);

        if (normalizedQuery.length === 0) {
            return [];
        }

        const limit = getSafeLimit(limitPerType);
        const likeQuery = toLikeQuery(normalizedQuery);

        const [
            collections,
            movies,
            series,
            albums,
            artists,
            episodes,
            songs,
        ] = await Promise.all([
            this.searchCollections(likeQuery, limit),
            this.searchMovies(likeQuery, limit),
            this.searchSeries(likeQuery, limit),
            this.searchAlbums(likeQuery, limit),
            this.searchArtists(likeQuery, limit),
            this.searchEpisodes(likeQuery, limit),
            this.searchSongs(likeQuery, limit),
        ]);

        return [
            ...collections,
            ...movies,
            ...series,
            ...albums,
            ...artists,
            ...episodes,
            ...songs,
        ];
    }

    private async searchCollections(likeQuery: string, limit: number): Promise<LibrarySearchItem[]> {
        const collectionRepo = DatabaseManager.getRepository(CollectionModel);

        const collectionEntities = await collectionRepo
            .createQueryBuilder('collection')
            .leftJoinAndSelect('collection.libraryCollections', 'libraryCollection')
            .leftJoinAndSelect('libraryCollection.library', 'library')
            .where('LOWER(collection.title) LIKE :query', { query: likeQuery })
            .take(limit)
            .getMany();

        const results = collectionEntities
            .map((collection) => {
                const firstLibraryType =
                    (collection.libraryCollections?.[0]?.library?.type as LibraryType | undefined) ?? undefined;

                return {
                    id: collection.id,
                    type: 'collection' as const,
                    title: collection.title,
                    subtitle: collection.description ?? '',
                    imageSrc: collection.posterSrc || collection.musicPosterSrc || undefined,
                    libraryType: firstLibraryType,
                    navigation: {
                        detailsType: 'collection' as const,
                        detailsId: collection.id,
                    },
                };
            })
            .filter((item) => !!item.navigation.detailsId);

        return sortByTitle(results);
    }

    private async searchMovies(likeQuery: string, limit: number): Promise<LibrarySearchItem[]> {
        const movieRepo = DatabaseManager.getRepository(MovieModel);

        const movieEntities = await movieRepo
            .createQueryBuilder('movie')
            .leftJoinAndSelect('movie.library', 'library')
            .where('LOWER(movie.name) LIKE :query', { query: likeQuery })
            .take(limit)
            .getMany();

        const results = movieEntities.map((movie) => ({
            id: movie.id,
            type: 'movie' as const,
            title: movie.name,
            subtitle: movie.year || '',
            imageSrc: movie.coverSrc || undefined,
            libraryType: movie.library?.type,
            navigation: {
                detailsType: 'movie' as const,
                detailsId: movie.id,
            },
        }));

        return sortByTitle(results);
    }

    private async searchSeries(likeQuery: string, limit: number): Promise<LibrarySearchItem[]> {
        const seriesRepo = DatabaseManager.getRepository(SeriesModel);

        const seriesEntities = await seriesRepo
            .createQueryBuilder('series')
            .leftJoinAndSelect('series.library', 'library')
            .where('LOWER(series.name) LIKE :query', { query: likeQuery })
            .take(limit)
            .getMany();

        const results = seriesEntities.map((show) => ({
            id: show.id,
            type: 'series' as const,
            title: show.name,
            subtitle: show.year || '',
            imageSrc: show.coverSrc || undefined,
            libraryType: show.library?.type,
            navigation: {
                detailsType: 'series' as const,
                detailsId: show.id,
            },
        }));

        return sortByTitle(results);
    }

    private async searchAlbums(likeQuery: string, limit: number): Promise<LibrarySearchItem[]> {
        const albumRepo = DatabaseManager.getRepository(AlbumModel);

        const albumEntities = await albumRepo
            .createQueryBuilder('album')
            .leftJoinAndSelect('album.library', 'library')
            .leftJoinAndSelect('album.albumArtists', 'albumArtist')
            .leftJoinAndSelect('albumArtist.artist', 'artist')
            .where('LOWER(album.title) LIKE :query', { query: likeQuery })
            .take(limit)
            .getMany();

        const results = albumEntities.map((album) => {
            const subtitle = uniqueArtistNames(
                (album.albumArtists ?? []).map((albumArtist) => albumArtist.artist?.name ?? ''),
            );

            return {
                id: album.id,
                type: 'album' as const,
                title: album.title,
                subtitle,
                imageSrc: album.coverSrc || undefined,
                libraryType: album.library?.type,
                navigation: {
                    detailsType: 'album' as const,
                    detailsId: album.id,
                },
            };
        });

        return sortByTitle(results);
    }

    private async searchArtists(likeQuery: string, limit: number): Promise<LibrarySearchItem[]> {
        const artistRepo = DatabaseManager.getRepository(ArtistModel);

        const artistEntities = await artistRepo
            .createQueryBuilder('artist')
            .leftJoinAndSelect('artist.albumArtists', 'albumArtist')
            .leftJoinAndSelect('albumArtist.album', 'album')
            .leftJoinAndSelect('album.library', 'library')
            .where('LOWER(artist.name) LIKE :query', { query: likeQuery })
            .take(limit)
            .getMany();

        const results = artistEntities
            .map((artist) => {
                const firstAlbum = artist.albumArtists?.[0]?.album;

                if (!firstAlbum?.id) {
                    return null;
                }

                return {
                    id: artist.id,
                    type: 'artist' as const,
                    title: artist.name,
                    subtitle: firstAlbum.title,
                    imageSrc: firstAlbum.coverSrc || undefined,
                    libraryType: firstAlbum.library?.type,
                    navigation: {
                        detailsType: 'album' as const,
                        detailsId: firstAlbum.id,
                    },
                };
            })
            .filter((item): item is ArtistSearchItem => item !== null);

        return sortByTitle(results);
    }

    private async searchEpisodes(likeQuery: string, limit: number): Promise<LibrarySearchItem[]> {
        const episodeRepo = DatabaseManager.getRepository(EpisodeModel);

        const episodeEntities = await episodeRepo
            .createQueryBuilder('episode')
            .innerJoinAndSelect('episode.season', 'season')
            .innerJoinAndSelect('season.series', 'series')
            .innerJoinAndSelect('series.library', 'library')
            .where('LOWER(episode.name) LIKE :query', { query: likeQuery })
            .take(limit)
            .getMany();

        const results = episodeEntities.map((episode) => ({
            id: episode.id,
            type: 'episode' as const,
            title: episode.name,
            subtitle: `${episode.season?.series?.name ?? ''} S${episode.seasonNumber}E${episode.episodeNumber}`,
            imageSrc: episode.season?.series?.coverSrc || undefined,
            libraryType: episode.season?.series?.library?.type,
            navigation: {
                detailsType: 'series' as const,
                detailsId: episode.season?.series?.id ?? '',
                focusItemId: episode.id,
                currentSeasonNumber: episode.seasonNumber,
            },
        }));

        return sortByTitle(results.filter((item) => item.navigation.detailsId));
    }

    private async searchSongs(likeQuery: string, limit: number): Promise<LibrarySearchItem[]> {
        const songRepo = DatabaseManager.getRepository(SongModel);

        const songEntities = await songRepo
            .createQueryBuilder('song')
            .innerJoinAndSelect('song.album', 'album')
            .innerJoinAndSelect('album.library', 'library')
            .leftJoinAndSelect('album.albumArtists', 'albumArtist')
            .leftJoinAndSelect('albumArtist.artist', 'artist')
            .where('LOWER(song.title) LIKE :query', { query: likeQuery })
            .take(limit)
            .getMany();

        const results = songEntities.map((song) => ({
            id: song.id,
            type: 'song' as const,
            title: song.title,
            subtitle: `${song.album?.title ?? ''} · ${uniqueArtistNames((song.album?.albumArtists ?? []).map((albumArtist) => albumArtist.artist?.name ?? ''))}`,
            imageSrc: song.album?.coverSrc || undefined,
            libraryType: song.album?.library?.type,
            navigation: {
                detailsType: 'album' as const,
                detailsId: song.album?.id ?? '',
                focusItemId: song.id,
            },
        }));

        return sortByTitle(results.filter((item) => item.navigation.detailsId));
    }
}
