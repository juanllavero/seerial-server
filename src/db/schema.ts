export const schemaSQL = `
-- Tabla Library
CREATE TABLE IF NOT EXISTS Library (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    language VARCHAR NOT NULL,
    type VARCHAR, -- Validado por triggers
    "order" INTEGER,
    folders TEXT,
    prefer_audio_lan VARCHAR,
    prefer_subs_lan VARCHAR,
    subs_mode VARCHAR,
    analyzed_files TEXT,
    analyzed_folders TEXT,
    season_folders TEXT
);

-- Triggers para Library (restricción CHECK para type)
CREATE TRIGGER IF NOT EXISTS library_type_insert
BEFORE INSERT ON Library
FOR EACH ROW
WHEN NEW.type NOT IN ('Shows', 'Movies', 'Music')
BEGIN
    SELECT RAISE(ABORT, 'Invalid value for type. Must be one of: Shows, Movies, Music');
END;

CREATE TRIGGER IF NOT EXISTS library_type_update
BEFORE UPDATE OF type ON Library
FOR EACH ROW
WHEN NEW.type NOT IN ('Shows', 'Movies', 'Music')
BEGIN
    SELECT RAISE(ABORT, 'Invalid value for type. Must be one of: Shows, Movies, Music');
END;

-- Tabla Collection
CREATE TABLE IF NOT EXISTS Collection (
    id INTEGER PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR
);

-- Tabla Collection_Series
CREATE TABLE IF NOT EXISTS Collection_Series (
    collection_id INTEGER NOT NULL,
    series_id INTEGER NOT NULL,
    PRIMARY KEY (collection_id, series_id),
    FOREIGN KEY (collection_id) REFERENCES Collection(id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES Series(id) ON DELETE CASCADE
);

-- Tabla Collection_Movie
CREATE TABLE IF NOT EXISTS Collection_Movie (
    collection_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    PRIMARY KEY (collection_id, movie_id),
    FOREIGN KEY (collection_id) REFERENCES Collection(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES Movie(id) ON DELETE CASCADE
);

-- Tabla Collection_Album
CREATE TABLE IF NOT EXISTS Collection_Album (
    collection_id INTEGER NOT NULL,
    album_id INTEGER NOT NULL,
    PRIMARY KEY (collection_id, album_id),
    FOREIGN KEY (collection_id) REFERENCES Collection(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES Album(id) ON DELETE CASCADE
);

-- Tabla Movie
CREATE TABLE IF NOT EXISTS Movie (
    id INTEGER PRIMARY KEY,
    library_id INTEGER NOT NULL,
    imdb_id VARCHAR,
    themdb_id INTEGER,
    imdb_score REAL,
    score REAL,
    "order" INTEGER,
    name VARCHAR NOT NULL,
    name_lock BOOLEAN,
    overview TEXT,
    overview_lock BOOLEAN,
    year VARCHAR,
    year_lock BOOLEAN,
    tagline VARCHAR,
    tagline_lock BOOLEAN,
    genres TEXT,
    genres_lock BOOLEAN,
    production_studios TEXT,
    production_studios_lock BOOLEAN,
    directed_by TEXT,
    directed_by_lock BOOLEAN,
    written_by TEXT,
    written_by_lock BOOLEAN,
    creator TEXT,
    creator_lock BOOLEAN,
    music_composer TEXT,
    music_composer_lock BOOLEAN,
    "cast" TEXT,
    logo_src VARCHAR,
    logos_urls TEXT,
    cover_src VARCHAR,
    covers_urls TEXT,
    watched BOOLEAN,
    FOREIGN KEY (library_id) REFERENCES Library(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_library_id ON Movie(library_id);

-- Tabla Series
CREATE TABLE IF NOT EXISTS Series (
    id INTEGER PRIMARY KEY,
    library_id INTEGER NOT NULL,
    themdb_id INTEGER,
    "order" INTEGER,
    name VARCHAR NOT NULL,
    name_lock BOOLEAN,
    overview TEXT,
    overview_lock BOOLEAN,
    year VARCHAR,
    year_lock BOOLEAN,
    score REAL,
    tagline VARCHAR,
    tagline_lock BOOLEAN,
    logo_src VARCHAR,
    logos_urls TEXT,
    cover_src VARCHAR,
    covers_urls TEXT,
    production_studios TEXT,
    production_studios_lock BOOLEAN,
    creator TEXT,
    creator_lock BOOLEAN,
    music_composer TEXT,
    music_composer_lock BOOLEAN,
    genres TEXT,
    genres_lock BOOLEAN,
    "cast" TEXT,
    folder VARCHAR,
    episode_group_id VARCHAR,
    currently_watching_episode_id INTEGER,
    watched BOOLEAN,
    FOREIGN KEY (library_id) REFERENCES Library(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_series_library_id ON Series(library_id);

-- Tabla Season
CREATE TABLE IF NOT EXISTS Season (
    id INTEGER PRIMARY KEY,
    series_id INTEGER NOT NULL,
    themdb_id INTEGER,
    "order" INTEGER,
    name VARCHAR NOT NULL,
    name_lock BOOLEAN,
    year VARCHAR,
    year_lock BOOLEAN,
    overview TEXT,
    overview_lock BOOLEAN,
    season_number INTEGER,
    cover_src VARCHAR,
    covers_urls TEXT,
    background_src VARCHAR,
    backgrounds_urls TEXT,
    video_src VARCHAR,
    music_src VARCHAR,
    folder VARCHAR,
    audio_track_language VARCHAR,
    selected_audio_track INTEGER,
    subtitle_track_language VARCHAR,
    selected_subtitle_track INTEGER,
    watched BOOLEAN,
    FOREIGN KEY (series_id) REFERENCES Series(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_season_series_id ON Season(series_id);

-- Tabla Episode
CREATE TABLE IF NOT EXISTS Episode (
    id INTEGER PRIMARY KEY,
    season_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    name_lock BOOLEAN,
    year VARCHAR,
    year_lock BOOLEAN,
    overview TEXT,
    overview_lock BOOLEAN,
    score REAL,
    directed_by TEXT,
    directed_by_lock BOOLEAN,
    written_by TEXT,
    written_by_lock BOOLEAN,
    episode_number INTEGER,
    season_number INTEGER,
    "order" INTEGER,
    FOREIGN KEY (season_id) REFERENCES Season(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_episode_season_id ON Episode(season_id);

-- Tabla Video
CREATE TABLE IF NOT EXISTS Video (
    id INTEGER PRIMARY KEY,
    file_src VARCHAR NOT NULL,
    runtime INTEGER,
    img_src VARCHAR,
    img_urls TEXT,
    watched BOOLEAN,
    time_watched INTEGER,
    last_watched DATETIME,
    media_info TEXT,
    video_tracks TEXT,
    subtitle_tracks TEXT,
    audio_tracks TEXT,
    chapters TEXT,
    episode_id INTEGER,
    movie_id INTEGER,
    is_movie_extra BOOLEAN,
	extra_type VARCHAR,
    FOREIGN KEY (episode_id) REFERENCES Episode(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES Movie(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_video_episode_id ON Video(episode_id);
CREATE INDEX IF NOT EXISTS idx_video_movie_id ON Video(movie_id);

-- Tabla Artist
CREATE TABLE IF NOT EXISTS Artist (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL
);

-- Tabla Album_Artist
CREATE TABLE IF NOT EXISTS Album_Artist (
    id INTEGER PRIMARY KEY,
    artist_id INTEGER NOT NULL,
    album_id INTEGER NOT NULL,
    FOREIGN KEY (artist_id) REFERENCES Artist(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES Album(id) ON DELETE CASCADE
);

-- Tabla Album
CREATE TABLE IF NOT EXISTS Album (
    id INTEGER PRIMARY KEY,
    library_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    year VARCHAR,
    description VARCHAR,
    FOREIGN KEY (library_id) REFERENCES Library(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_album_library_id ON Album(library_id);

-- Tabla Song
CREATE TABLE IF NOT EXISTS Song (
    id INTEGER PRIMARY KEY,
    album_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    track_number INTEGER NOT NULL,
    FOREIGN KEY (album_id) REFERENCES Album(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_song_album_id ON Song(album_id);

-- Tabla PlayList
CREATE TABLE IF NOT EXISTS PlayList (
    id INTEGER PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR
);

-- Tabla PlayList_Item
CREATE TABLE IF NOT EXISTS PlayList_Item (
    id INTEGER PRIMARY KEY,
    playlist_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    FOREIGN KEY (playlist_id) REFERENCES PlayList(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES Song(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlist_item_playlist_id ON PlayList_Item(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_item_song_id ON PlayList_Item(song_id);

-- Tabla My_List
CREATE TABLE IF NOT EXISTS My_List (
    id VARCHAR PRIMARY KEY,
    added_at DATETIME,
    series_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    FOREIGN KEY (series_id) REFERENCES Series(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES Movie(id) ON DELETE CASCADE
);

-- Tabla Continue_Watching
CREATE TABLE IF NOT EXISTS Continue_Watching (
    id INTEGER PRIMARY KEY,
    video_id INTEGER NOT NULL,
    FOREIGN KEY (video_id) REFERENCES Video(id) ON DELETE CASCADE
);
`;
