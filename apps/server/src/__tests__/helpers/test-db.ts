import "reflect-metadata";
import initSqlJs from "sql.js";
import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { AlbumArtistModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumArtistModel";
import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { ArtistModel } from "@/api/v1/artists/infrastructure/persistence/models/ArtistModel";
import { CollectionAlbumModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionAlbum";
import { CollectionModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionModel";
import { CollectionMovieModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionMovie";
import { CollectionSeriesModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionSeries";
import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { LibraryCollectionModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { PlayListItemModel } from "@/api/v1/playlists/infrastructure/persistence/models/PlayListItemModel";
import { PlayListModel } from "@/api/v1/playlists/infrastructure/persistence/models/PlayListModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { ServerModel } from "@/api/v1/servers/infrastructure/persistence/models/ServerModel";
import { SongModel } from "@/api/v1/songs/infrastructure/persistence/models/SongModel";
import { UserLibraryModel } from "@/api/v1/users/infrastructure/persistence/models/UserLibraryModel";
import { UserModel } from "@/api/v1/users/infrastructure/persistence/models/UserModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";

let testDataSource: DataSource | null = null;

export async function getTestDataSource(): Promise<DataSource> {
	if (testDataSource?.isInitialized) {
		return testDataSource;
	}

	// Use sql.js (pure-JS SQLite) so tests work regardless of whether
	// better-sqlite3 was compiled for Electron or regular Node.js.
	const SQL = await initSqlJs();

	testDataSource = new DataSource({
		type: "sqljs",
		driver: SQL,
		namingStrategy: new SnakeNamingStrategy(),
		entities: [
			CollectionModel,
			CollectionAlbumModel,
			CollectionMovieModel,
			CollectionSeriesModel,
			LibraryCollectionModel,
			WatchListModel,
			EpisodeModel,
			LibraryModel,
			MovieModel,
			PlayListModel,
			PlayListItemModel,
			SeasonModel,
			SeriesModel,
			VideoModel,
			AlbumModel,
			AlbumArtistModel,
			ArtistModel,
			SongModel,
			ServerModel,
			UserModel,
			UserLibraryModel,
		],
		synchronize: true,
		logging: false,
		autoSave: false,
	});

	await testDataSource.initialize();
	return testDataSource;
}

export async function closeTestDataSource(): Promise<void> {
	if (testDataSource?.isInitialized) {
		await testDataSource.destroy();
		testDataSource = null;
	}
}

export async function clearAllTables(ds: DataSource): Promise<void> {
	const entities = ds.entityMetadatas;
	for (const entity of entities) {
		const repo = ds.getRepository(entity.name);
		await repo.clear();
	}
}
