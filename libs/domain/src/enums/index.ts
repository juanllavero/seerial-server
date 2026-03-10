export enum LibraryTypes {
  SHOWS = "Shows",
  MOVIES = "Movies",
  MUSIC = "Music",
}

export enum RepeateMode {
  NONE = 0,
  REPEAT_ALL = 1,
  REPEAT_ONE = 2,
}

export enum ScreenHeight {
  HD = "HD",
  FHD = "FHD",
  QHD = "QHD",
  UHD = "UHD",
}

export enum WindowSections {
  General = 1,
  Folders,
  Tags,
  Details,
  Logos,
  Posters,
  Thumbnails,
  Advanced,
}

export enum SettingsSections {
  ClientGeneral = 1,
  ClientPlayer,
  ClientQuality,
  ServerGeneral,
  ServerTranscode,
  ServerLibrary,
  ServerLanguages,
}

// Enum for message types
export enum MessageType {
  NO_MESSAGE = "",
  DOWNLOAD_PROGRESS = "DOWNLOAD_PROGRESS",
  DOWNLOAD_ERROR = "DOWNLOAD_ERROR",
  DOWNLOAD_COMPLETE = "DOWNLOAD_COMPLETE",
  MUTATE_LIBRARIES = "MUTATE_LIBRARIES",
  MUTATE_LIBRARY = "MUTATE_LIBRARY",
  MUTATE_COLLECTION = "MUTATE_COLLECTION",
  MUTATE_SERIES = "MUTATE_SERIES",
  MUTATE_SEASON = "MUTATE_SEASON",
  MUTATE_EPISODE = "MUTATE_EPISODE",
  MUTATE_MOVIE = "MUTATE_MOVIE",
  MUTATE_ALBUM = "MUTATE_ALBUM",
  SCAN_STARTED = "SCAN_STARTED",
  SCAN_COMPLETE = "SCAN_COMPLETE",
}
