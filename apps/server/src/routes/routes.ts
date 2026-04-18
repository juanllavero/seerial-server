/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { WatchListController } from './../api/v1/watch-lists/infrastructure/web/controllers/WatchListController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ContinueWatchingController } from './../api/v1/watch-lists/infrastructure/web/controllers/ContinueWatchingController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VideoStreamingController } from './../api/v1/videos/infrastructure/web/controllers/VideoStreamingController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VideosController } from './../api/v1/videos/infrastructure/web/controllers/VideosController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UsersController } from './../api/v1/users/infrastructure/web/controllers/UsersController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SongsController } from './../api/v1/songs/infrastructure/web/controllers/SongsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SearchController } from './../api/v1/shared/infrastructure/web/controllers/SearchController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MediaController } from './../api/v1/shared/infrastructure/web/controllers/MediaController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from './../api/v1/shared/infrastructure/web/controllers/HealthController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FilesController } from './../api/v1/shared/infrastructure/web/controllers/FilesController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DownloadController } from './../api/v1/shared/infrastructure/web/controllers/DownloadController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { APIKeyController } from './../api/v1/shared/infrastructure/web/controllers/APIKeyController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AlbumsController } from './../api/v1/albums/infrastructure/web/controllers/AlbumsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ArtistsController } from './../api/v1/artists/infrastructure/web/controllers/ArtistsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CollectionsController } from './../api/v1/collections/infrastructure/web/controllers/CollectionsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EpisodesController } from './../api/v1/episodes/infrastructure/web/controllers/EpisodesController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ImagesController } from './../api/v1/images/infrastructure/web/controllers/ImagesController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LibrariesController } from './../api/v1/libraries/infrastructure/web/controllers/LibrariesController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MoviesController } from './../api/v1/movies/infrastructure/web/controllers/MoviesController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PlayListController } from './../api/v1/playlists/infrastructure/web/controllers/PlayListController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SeasonsController } from './../api/v1/seasons/infrastructure/web/controllers/SeasonsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SeriesController } from './../api/v1/series/infrastructure/web/controllers/SeriesController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ServersController } from './../api/v1/servers/infrastructure/web/controllers/ServersController';
import { expressAuthentication } from './../middleware/tsoa.authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');


const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "ApiResponse_null_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":[null]},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateWatchStateDTO": {
        "dataType": "refObject",
        "properties": {
            "videoId": {"dataType":"string","required":true},
            "timeWatched": {"dataType":"double","required":true},
            "watched": {"dataType":"boolean","required":true},
            "userId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DetailsData": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "subtitle": {"dataType":"string"},
            "tagline": {"dataType":"string"},
            "year": {"dataType":"string"},
            "genres": {"dataType":"string","required":true},
            "score": {"dataType":"double"},
            "imdbScore": {"dataType":"double"},
            "description": {"dataType":"string","required":true},
            "directedBy": {"dataType":"string"},
            "createdBy": {"dataType":"string"},
            "watched": {"dataType":"boolean"},
            "coverSrc": {"dataType":"string"},
            "logoSrc": {"dataType":"string"},
            "backgroundSrc": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContinueWatchingVideoDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "subtitle": {"dataType":"string"},
            "episodeNumber": {"dataType":"double"},
            "seasonNumber": {"dataType":"double"},
            "date": {"dataType":"string","required":true},
            "duration": {"dataType":"double","required":true},
            "timeWatched": {"dataType":"double","required":true},
            "genres": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "overview": {"dataType":"string","required":true},
            "backgroundImage": {"dataType":"string","required":true},
            "posterImage": {"dataType":"string","required":true},
            "logoImage": {"dataType":"string","required":true},
            "videoImage": {"dataType":"string","required":true},
            "movieId": {"dataType":"string"},
            "episodeId": {"dataType":"string"},
            "seriesId": {"dataType":"string"},
            "videoId": {"dataType":"string","required":true},
            "details": {"dataType":"union","subSchemas":[{"ref":"DetailsData"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ContinueWatchingVideoDTO-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"ContinueWatchingVideoDTO"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_string_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StreamUrlDTO": {
        "dataType": "refObject",
        "properties": {
            "filePath": {"dataType":"string","required":true},
            "start": {"dataType":"double"},
            "audio": {"dataType":"double"},
            "quality": {"dataType":"string"},
            "bitrate": {"dataType":"double"},
            "expiresIn": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_string-or-null_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VideoUrlDTO": {
        "dataType": "refObject",
        "properties": {
            "filePath": {"dataType":"string","required":true},
            "localId": {"dataType":"string"},
            "expiresIn": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CastData": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "character": {"dataType":"string","required":true},
            "profileImage": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Video": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "fileSrc": {"dataType":"string","required":true},
            "hash": {"dataType":"string","required":true},
            "runtime": {"dataType":"double","required":true},
            "imgSrc": {"dataType":"string","required":true},
            "imgUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "continueWatching": {"dataType":"array","array":{"dataType":"refObject","ref":"ContinueWatching"},"required":true},
            "watchLists": {"dataType":"array","array":{"dataType":"refObject","ref":"WatchList"},"required":true},
            "mediaInfo": {"ref":"MediaInfo"},
            "videoTracks": {"dataType":"array","array":{"dataType":"refObject","ref":"VideoTrack"}},
            "subtitleTracks": {"dataType":"array","array":{"dataType":"refObject","ref":"SubtitleTrack"}},
            "audioTracks": {"dataType":"array","array":{"dataType":"refObject","ref":"AudioTrack"}},
            "chapters": {"dataType":"array","array":{"dataType":"refObject","ref":"Chapter"}},
            "selectedAudioTrack": {"dataType":"double"},
            "selectedSubtitleTrack": {"dataType":"double"},
            "extraType": {"dataType":"string"},
            "episodeId": {"dataType":"string"},
            "movieId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Episode": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "seasonId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "nameLock": {"dataType":"boolean","required":true},
            "year": {"dataType":"string","required":true},
            "yearLock": {"dataType":"boolean","required":true},
            "overview": {"dataType":"string","required":true},
            "overviewLock": {"dataType":"boolean","required":true},
            "score": {"dataType":"double","required":true},
            "directedBy": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "directedByLock": {"dataType":"boolean","required":true},
            "writtenBy": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "writtenByLock": {"dataType":"boolean","required":true},
            "episodeNumber": {"dataType":"double","required":true},
            "seasonNumber": {"dataType":"double","required":true},
            "order": {"dataType":"double","required":true},
            "video": {"ref":"Video","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WatchList": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "seriesId": {"dataType":"string"},
            "seasonId": {"dataType":"string"},
            "episodeId": {"dataType":"string"},
            "episode": {"ref":"Episode"},
            "movieId": {"dataType":"string"},
            "movie": {"ref":"Movie"},
            "videoId": {"dataType":"string"},
            "video": {"ref":"Video"},
            "timeWatched": {"dataType":"double","required":true},
            "watched": {"dataType":"boolean","required":true},
            "lastWatched": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Movie": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "libraryId": {"dataType":"string","required":true},
            "imdbId": {"dataType":"string","required":true},
            "themdbId": {"dataType":"double","required":true},
            "imdbScore": {"dataType":"double","required":true},
            "score": {"dataType":"double","required":true},
            "order": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "nameLock": {"dataType":"boolean","required":true},
            "overview": {"dataType":"string","required":true},
            "overviewLock": {"dataType":"boolean","required":true},
            "year": {"dataType":"string","required":true},
            "yearLock": {"dataType":"boolean","required":true},
            "tagline": {"dataType":"string","required":true},
            "taglineLock": {"dataType":"boolean","required":true},
            "genres": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "genresLock": {"dataType":"boolean","required":true},
            "productionStudios": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "productionStudiosLock": {"dataType":"boolean","required":true},
            "directedBy": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "directedByLock": {"dataType":"boolean","required":true},
            "writtenBy": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "writtenByLock": {"dataType":"boolean","required":true},
            "creator": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "creatorLock": {"dataType":"boolean","required":true},
            "musicComposer": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "musicComposerLock": {"dataType":"boolean","required":true},
            "cast": {"dataType":"array","array":{"dataType":"refObject","ref":"CastData"},"required":true},
            "videoSrc": {"dataType":"string","required":true},
            "musicSrc": {"dataType":"string","required":true},
            "folder": {"dataType":"string","required":true},
            "logoSrc": {"dataType":"string","required":true},
            "logosUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "backgroundSrc": {"dataType":"string","required":true},
            "backgroundsUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "coverSrc": {"dataType":"string","required":true},
            "coversUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "watchLists": {"dataType":"array","array":{"dataType":"refObject","ref":"WatchList"},"required":true},
            "videos": {"dataType":"array","array":{"dataType":"refObject","ref":"Video"},"required":true},
            "extras": {"dataType":"array","array":{"dataType":"refObject","ref":"Video"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Season": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "seriesId": {"dataType":"string","required":true},
            "order": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "nameLock": {"dataType":"boolean","required":true},
            "year": {"dataType":"string","required":true},
            "yearLock": {"dataType":"boolean","required":true},
            "overview": {"dataType":"string","required":true},
            "overviewLock": {"dataType":"boolean","required":true},
            "seasonNumber": {"dataType":"double","required":true},
            "backgroundSrc": {"dataType":"string","required":true},
            "backgroundsUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "videoSrc": {"dataType":"string","required":true},
            "musicSrc": {"dataType":"string","required":true},
            "watchLists": {"dataType":"array","array":{"dataType":"refObject","ref":"WatchList"},"required":true},
            "episodes": {"dataType":"array","array":{"dataType":"refObject","ref":"Episode"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Series": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "libraryId": {"dataType":"string","required":true},
            "themdbId": {"dataType":"double","required":true},
            "order": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "nameLock": {"dataType":"boolean","required":true},
            "overview": {"dataType":"string","required":true},
            "overviewLock": {"dataType":"boolean","required":true},
            "year": {"dataType":"string","required":true},
            "yearLock": {"dataType":"boolean","required":true},
            "score": {"dataType":"double","required":true},
            "tagline": {"dataType":"string","required":true},
            "taglineLock": {"dataType":"boolean","required":true},
            "logoSrc": {"dataType":"string","required":true},
            "logosUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "coverSrc": {"dataType":"string","required":true},
            "coversUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "productionStudios": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "productionStudiosLock": {"dataType":"boolean","required":true},
            "creator": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "creatorLock": {"dataType":"boolean","required":true},
            "musicComposer": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "musicComposerLock": {"dataType":"boolean","required":true},
            "genres": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "genresLock": {"dataType":"boolean","required":true},
            "cast": {"dataType":"array","array":{"dataType":"refObject","ref":"CastData"},"required":true},
            "preferAudioLan": {"dataType":"string"},
            "preferSubLan": {"dataType":"string"},
            "subsMode": {"dataType":"string"},
            "folder": {"dataType":"string","required":true},
            "episodeGroupId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "analyzingFiles": {"dataType":"boolean","required":true},
            "watchLists": {"dataType":"array","array":{"dataType":"refObject","ref":"WatchList"},"required":true},
            "seasons": {"dataType":"array","array":{"dataType":"refObject","ref":"Season"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContinueWatching": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "seriesId": {"dataType":"string"},
            "series": {"ref":"Series"},
            "movieId": {"dataType":"string"},
            "movie": {"ref":"Movie"},
            "videoId": {"dataType":"string","required":true},
            "video": {"ref":"Video","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MediaInfo": {
        "dataType": "refObject",
        "properties": {
            "file": {"dataType":"string","required":true},
            "location": {"dataType":"string","required":true},
            "bitrate": {"dataType":"string","required":true},
            "duration": {"dataType":"string","required":true},
            "size": {"dataType":"string","required":true},
            "container": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VideoTrack": {
        "dataType": "refObject",
        "properties": {
            "displayTitle": {"dataType":"string","required":true},
            "id": {"dataType":"double","required":true},
            "selected": {"dataType":"boolean","required":true},
            "codec": {"dataType":"string","required":true},
            "codecExt": {"dataType":"string","required":true},
            "bitrate": {"dataType":"string","required":true},
            "framerate": {"dataType":"string","required":true},
            "codedHeight": {"dataType":"string","required":true},
            "codedWidth": {"dataType":"string","required":true},
            "chromaLocation": {"dataType":"string","required":true},
            "colorSpace": {"dataType":"string","required":true},
            "aspectRatio": {"dataType":"string","required":true},
            "profile": {"dataType":"string","required":true},
            "refFrames": {"dataType":"string","required":true},
            "colorRange": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubtitleTrack": {
        "dataType": "refObject",
        "properties": {
            "displayTitle": {"dataType":"string","required":true},
            "id": {"dataType":"double","required":true},
            "language": {"dataType":"string","required":true},
            "languageTag": {"dataType":"string","required":true},
            "selected": {"dataType":"boolean","required":true},
            "codec": {"dataType":"string","required":true},
            "codecExt": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AudioTrack": {
        "dataType": "refObject",
        "properties": {
            "displayTitle": {"dataType":"string","required":true},
            "id": {"dataType":"double","required":true},
            "language": {"dataType":"string","required":true},
            "languageTag": {"dataType":"string","required":true},
            "selected": {"dataType":"boolean","required":true},
            "codec": {"dataType":"string","required":true},
            "codecExt": {"dataType":"string","required":true},
            "channels": {"dataType":"string","required":true},
            "channelLayout": {"dataType":"string","required":true},
            "bitrate": {"dataType":"string","required":true},
            "bitDepth": {"dataType":"string","required":true},
            "profile": {"dataType":"string","required":true},
            "samplingRate": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Chapter": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "time": {"dataType":"double","required":true},
            "displayTime": {"dataType":"string","required":true},
            "thumbnailSrc": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Video_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Video"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MediaInfoData": {
        "dataType": "refObject",
        "properties": {
            "mediaInfo": {"dataType":"union","subSchemas":[{"ref":"MediaInfo"},{"dataType":"undefined"}],"required":true},
            "videoTracks": {"dataType":"array","array":{"dataType":"refObject","ref":"VideoTrack"},"required":true},
            "subtitleTracks": {"dataType":"array","array":{"dataType":"refObject","ref":"SubtitleTrack"},"required":true},
            "audioTracks": {"dataType":"array","array":{"dataType":"refObject","ref":"AudioTrack"},"required":true},
            "chapters": {"dataType":"array","array":{"dataType":"refObject","ref":"Chapter"},"required":true},
            "duration": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayBackConfig": {
        "dataType": "refObject",
        "properties": {
            "preferAudioLan": {"dataType":"string","required":true},
            "preferSubLan": {"dataType":"string","required":true},
            "subsMode": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayBackInfo": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "subtitle": {"dataType":"string"},
            "info": {"dataType":"string"},
            "mediaInfoData": {"ref":"MediaInfoData"},
            "playBackConfig": {"ref":"PlayBackConfig"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_PlayBackInfo_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"PlayBackInfo"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateVideoDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "fileSrc": {"dataType":"string"},
            "runtime": {"dataType":"double"},
            "imgSrc": {"dataType":"string"},
            "imgUrls": {"dataType":"array","array":{"dataType":"string"}},
            "selectedAudioTrack": {"dataType":"double"},
            "selectedSubtitleTrack": {"dataType":"double"},
            "extraType": {"dataType":"string"},
            "episodeId": {"dataType":"string"},
            "movieId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetVideoWatchStateDTO": {
        "dataType": "refObject",
        "properties": {
            "watched": {"dataType":"boolean","required":true},
            "userId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "username": {"dataType":"string","required":true},
            "avatar": {"dataType":"string"},
            "allowRemote": {"dataType":"boolean","required":true},
            "type": {"dataType":"string","required":true},
            "allowVideoTranscoding": {"dataType":"boolean","required":true},
            "internetBitrateLimit": {"dataType":"double"},
            "allowDownloads": {"dataType":"boolean","required":true},
            "hideInLogin": {"dataType":"boolean","required":true},
            "maxSessions": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__token-string--user-UserDTO__": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"user":{"ref":"UserDTO","required":true},"token":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserType": {
        "dataType": "refEnum",
        "enums": ["normal","admin"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserDTO": {
        "dataType": "refObject",
        "properties": {
            "username": {"dataType":"string","required":true},
            "password": {"dataType":"string"},
            "avatar": {"dataType":"string"},
            "allowRemote": {"dataType":"boolean"},
            "type": {"ref":"UserType"},
            "allowVideoTranscoding": {"dataType":"boolean"},
            "internetBitrateLimit": {"dataType":"double"},
            "allowDownloads": {"dataType":"boolean"},
            "hideInLogin": {"dataType":"boolean"},
            "maxSessions": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_UserDTO_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"UserDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserDTO": {
        "dataType": "refObject",
        "properties": {
            "username": {"dataType":"string"},
            "password": {"dataType":"string"},
            "avatar": {"dataType":"string"},
            "allowRemote": {"dataType":"boolean"},
            "type": {"ref":"UserType"},
            "allowVideoTranscoding": {"dataType":"boolean"},
            "internetBitrateLimit": {"dataType":"double"},
            "allowDownloads": {"dataType":"boolean"},
            "hideInLogin": {"dataType":"boolean"},
            "maxSessions": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_UserDTO-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"UserDTO"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "user": {"dataType":"union","subSchemas":[{"ref":"UserDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "token": {"dataType":"string"},
            "error": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LoginResponseDTO_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"LoginResponseDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginDTO": {
        "dataType": "refObject",
        "properties": {
            "username": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Song": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "albumId": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "codec": {"dataType":"string","required":true},
            "hasDolbyAtmos": {"dataType":"boolean","required":true},
            "trackNumber": {"dataType":"double","required":true},
            "discNumber": {"dataType":"double","required":true},
            "artists": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "composers": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "duration": {"dataType":"double","required":true},
            "fileSrc": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Song_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Song"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSongDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "codec": {"dataType":"string"},
            "hasDolbyAtmos": {"dataType":"boolean"},
            "trackNumber": {"dataType":"double"},
            "discNumber": {"dataType":"double"},
            "artists": {"dataType":"array","array":{"dataType":"string"}},
            "composers": {"dataType":"array","array":{"dataType":"string"}},
            "duration": {"dataType":"double"},
            "fileSrc": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SeparateSongStemsResponseDTO": {
        "dataType": "refObject",
        "properties": {
            "jobId": {"dataType":"string","required":true},
            "songId": {"dataType":"string","required":true},
            "inputPath": {"dataType":"string","required":true},
            "instrumentalPath": {"dataType":"string","required":true},
            "vocalsPath": {"dataType":"string","required":true},
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["queued"]},{"dataType":"enum","enums":["started"]},{"dataType":"enum","enums":["processing"]},{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["error"]}],"required":true},
            "message": {"dataType":"string"},
            "progress": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_SeparateSongStemsResponseDTO_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"SeparateSongStemsResponseDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlainLyricsLine": {
        "dataType": "refObject",
        "properties": {
            "original": {"dataType":"string"},
            "pronunciation": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LyricWord": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"string","required":true},
            "startTime": {"dataType":"double","required":true},
            "endTime": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EnhancedLyricsLine": {
        "dataType": "refObject",
        "properties": {
            "original": {"dataType":"array","array":{"dataType":"refObject","ref":"LyricWord"},"required":true},
            "pronunciation": {"dataType":"array","array":{"dataType":"refObject","ref":"LyricWord"}},
            "backgroundVocals": {"dataType":"array","array":{"dataType":"refObject","ref":"LyricWord"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LyricsLine": {
        "dataType": "refObject",
        "properties": {
            "agent": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["v1"]},{"dataType":"enum","enums":["v2"]}],"required":true},
            "startTime": {"dataType":"double","required":true},
            "plainText": {"ref":"PlainLyricsLine"},
            "words": {"ref":"EnhancedLyricsLine"},
            "translation": {"dataType":"string"},
            "isBlank": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LyricsLine-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"LyricsLine"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SongUrlDTO": {
        "dataType": "refObject",
        "properties": {
            "filePath": {"dataType":"string","required":true},
            "localId": {"dataType":"string"},
            "expiresIn": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"string"}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MediaSearchResult": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
            "duration": {"dataType":"double","required":true},
            "thumbnail": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_MediaSearchResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"MediaSearchResult"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_unknown_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"any"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HealthStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ok"]},{"dataType":"enum","enums":["degraded"]},{"dataType":"enum","enums":["down"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HealthResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"ref":"HealthStatus","required":true},
            "checks": {"dataType":"nestedObjectLiteral","nestedProperties":{"tmdb":{"ref":"HealthStatus","required":true},"ffmpeg":{"ref":"HealthStatus","required":true},"database":{"ref":"HealthStatus","required":true},"filesystem":{"ref":"HealthStatus","required":true}},"required":true},
            "uptime": {"dataType":"double","required":true},
            "timestamp": {"dataType":"double","required":true},
            "version": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_HealthResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"HealthResponse"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_string-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FileItem": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "isFolder": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_FileItem-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"FileItem"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DownloadVideoDTO": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "downloadFolder": {"dataType":"string","required":true},
            "fileName": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DownloadMusicDTO": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "downloadFolder": {"dataType":"string","required":true},
            "fileName": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DownloadImageDTO": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "downloadFolder": {"dataType":"string","required":true},
            "fileName": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "APIKeyResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["VALID_API_KEY"]},{"dataType":"enum","enums":["INVALID_API_KEY"]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_APIKeyResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"APIKeyResponse"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "APIKeyDTO": {
        "dataType": "refObject",
        "properties": {
            "apiKey": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Album": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "libraryId": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "year": {"dataType":"string"},
            "genres": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "folder": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "coverSrc": {"dataType":"string","required":true},
            "songs": {"dataType":"array","array":{"dataType":"refObject","ref":"Song"},"required":true},
            "albumArtists": {"dataType":"array","array":{"dataType":"refObject","ref":"AlbumArtist"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Artist": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AlbumArtist": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "album": {"ref":"Album","required":true},
            "artist": {"ref":"Artist","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Album-or-null_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"union","subSchemas":[{"ref":"Album"},{"dataType":"enum","enums":[null]}]},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Album_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Album"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateAlbumDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "year": {"dataType":"string"},
            "genres": {"dataType":"array","array":{"dataType":"string"}},
            "folder": {"dataType":"string"},
            "description": {"dataType":"string"},
            "coverSrc": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Artist_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Artist"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateArtistDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MusicExtrasDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "src": {"dataType":"string","required":true},
            "type": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_MusicExtrasDTO-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"MusicExtrasDTO"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["series"]},{"dataType":"enum","enums":["movie"]},{"dataType":"enum","enums":["album"]},{"dataType":"enum","enums":["collection"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LibraryItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "years": {"dataType":"string"},
            "coverSrc": {"dataType":"string"},
            "backgroundSrc": {"dataType":"string"},
            "numberOfItems": {"dataType":"double","required":true},
            "order": {"dataType":"double","required":true},
            "watched": {"dataType":"boolean","required":true},
            "remainingItems": {"dataType":"double","required":true},
            "analyzingFiles": {"dataType":"boolean","required":true},
            "type": {"ref":"ItemType","required":true},
            "details": {"dataType":"union","subSchemas":[{"ref":"DetailsData"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CollectionContentDTO": {
        "dataType": "refObject",
        "properties": {
            "movies": {"dataType":"array","array":{"dataType":"refObject","ref":"LibraryItem"},"required":true},
            "series": {"dataType":"array","array":{"dataType":"refObject","ref":"LibraryItem"},"required":true},
            "albums": {"dataType":"array","array":{"dataType":"refObject","ref":"LibraryItem"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_CollectionContentDTO_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"CollectionContentDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReorderItemDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["movie"]},{"dataType":"enum","enums":["movies"]},{"dataType":"enum","enums":["series"]},{"dataType":"enum","enums":["show"]},{"dataType":"enum","enums":["shows"]},{"dataType":"enum","enums":["album"]},{"dataType":"enum","enums":["albums"]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReorderContentDTO": {
        "dataType": "refObject",
        "properties": {
            "orderedItems": {"dataType":"array","array":{"dataType":"refObject","ref":"ReorderItemDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Collection": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "backgroundSrc": {"dataType":"string","required":true},
            "backgroundsUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "coverSrc": {"dataType":"string","required":true},
            "coversUrls": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "numberOfItems": {"dataType":"double"},
            "musicPosterSrc": {"dataType":"string"},
            "shows": {"dataType":"array","array":{"dataType":"refObject","ref":"Series"},"required":true},
            "movies": {"dataType":"array","array":{"dataType":"refObject","ref":"Movie"},"required":true},
            "albums": {"dataType":"array","array":{"dataType":"refObject","ref":"Album"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Collection-or-null_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"union","subSchemas":[{"ref":"Collection"},{"dataType":"enum","enums":[null]}]},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Collection_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Collection"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCollectionDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "description": {"dataType":"string"},
            "backgroundSrc": {"dataType":"string"},
            "backgroundsUrls": {"dataType":"array","array":{"dataType":"string"}},
            "coverSrc": {"dataType":"string"},
            "coversUrls": {"dataType":"array","array":{"dataType":"string"}},
            "musicPosterSrc": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Episode-or-null_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"union","subSchemas":[{"ref":"Episode"},{"dataType":"enum","enums":[null]}]},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Episode_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Episode"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateEpisodeDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "episodeNumber": {"dataType":"double"},
            "description": {"dataType":"string"},
            "airDate": {"dataType":"string"},
            "duration": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetEpisodeWatchStateDTO": {
        "dataType": "refObject",
        "properties": {
            "state": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LibraryType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Shows"]},{"dataType":"enum","enums":["Movies"]},{"dataType":"enum","enums":["Music"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Library": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "language": {"dataType":"string","required":true},
            "type": {"ref":"LibraryType","required":true},
            "order": {"dataType":"double","required":true},
            "hidden": {"dataType":"boolean","required":true},
            "folders": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "preferAudioLan": {"dataType":"string"},
            "preferSubLan": {"dataType":"string"},
            "subsMode": {"dataType":"string"},
            "analyzedFiles": {"ref":"Record_string.string_","required":true},
            "analyzedFolders": {"ref":"Record_string.string_","required":true},
            "backgroundSrc": {"dataType":"string","required":true},
            "series": {"dataType":"array","array":{"dataType":"refObject","ref":"Series"},"required":true},
            "movies": {"dataType":"array","array":{"dataType":"refObject","ref":"Movie"},"required":true},
            "albums": {"dataType":"array","array":{"dataType":"refObject","ref":"Album"},"required":true},
            "collections": {"dataType":"array","array":{"dataType":"refObject","ref":"Collection"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Library-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"Library"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Library_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Library"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LibraryItem-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"LibraryItem"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateLibraryDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "language": {"dataType":"string","required":true},
            "type": {"ref":"LibraryType","required":true},
            "folders": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "preferAudioLan": {"dataType":"string"},
            "preferSubLan": {"dataType":"string"},
            "subsMode": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateLibraryDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "language": {"dataType":"string"},
            "type": {"ref":"LibraryType"},
            "order": {"dataType":"double"},
            "hidden": {"dataType":"boolean"},
            "folders": {"dataType":"array","array":{"dataType":"string"}},
            "preferAudioLan": {"dataType":"string"},
            "preferSubLan": {"dataType":"string"},
            "subsMode": {"dataType":"string"},
            "backgroundSrc": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_boolean_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReorderLibrariesDTO": {
        "dataType": "refObject",
        "properties": {
            "orderedLibraryIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReorderItemsDTO": {
        "dataType": "refObject",
        "properties": {
            "orderedItems": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"type":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChangeIdentificationDTO": {
        "dataType": "refObject",
        "properties": {
            "themdbId": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Movie_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Movie"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateMovieDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "releaseDate": {"dataType":"string"},
            "overview": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetMovieWatchStateDTO": {
        "dataType": "refObject",
        "properties": {
            "watched": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MovieResult": {
        "dataType": "refObject",
        "properties": {
            "poster_path": {"dataType":"string"},
            "adult": {"dataType":"boolean"},
            "overview": {"dataType":"string"},
            "release_date": {"dataType":"string"},
            "genre_ids": {"dataType":"array","array":{"dataType":"double"}},
            "id": {"dataType":"double"},
            "media_type": {"dataType":"enum","enums":["movie"],"required":true},
            "original_title": {"dataType":"string"},
            "original_language": {"dataType":"string"},
            "title": {"dataType":"string"},
            "backdrop_path": {"dataType":"string"},
            "popularity": {"dataType":"double"},
            "vote_count": {"dataType":"double"},
            "video": {"dataType":"boolean"},
            "vote_average": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_MovieResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"MovieResult"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_number_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlayList": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_PlayList-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"PlayList"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_PlayList_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"PlayList"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreatePlayListDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePlayListDTO": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "description": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddSongToPlaylistDTO": {
        "dataType": "refObject",
        "properties": {
            "songId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Season_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Season"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IncludeType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["none"]},{"dataType":"enum","enums":["few"]},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSeasonDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "nameLock": {"dataType":"boolean"},
            "year": {"dataType":"string"},
            "yearLock": {"dataType":"boolean"},
            "overview": {"dataType":"string"},
            "overviewLock": {"dataType":"boolean"},
            "seasonNumber": {"dataType":"double"},
            "backgroundSrc": {"dataType":"string"},
            "backgroundsUrls": {"dataType":"array","array":{"dataType":"string"}},
            "videoSrc": {"dataType":"string"},
            "musicSrc": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetSeasonWatchStateDTO": {
        "dataType": "refObject",
        "properties": {
            "watched": {"dataType":"boolean","required":true},
            "userId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RefreshMetadataDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateShowIdDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "themdbId": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateEpisodeGroupDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "themdbId": {"dataType":"double","required":true},
            "episodeGroupId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Series_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Series"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSeriesDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "nameLock": {"dataType":"boolean"},
            "overview": {"dataType":"string"},
            "overviewLock": {"dataType":"boolean"},
            "year": {"dataType":"string"},
            "yearLock": {"dataType":"boolean"},
            "score": {"dataType":"double"},
            "tagline": {"dataType":"string"},
            "taglineLock": {"dataType":"boolean"},
            "logoSrc": {"dataType":"string"},
            "logosUrls": {"dataType":"array","array":{"dataType":"string"}},
            "coverSrc": {"dataType":"string"},
            "coversUrls": {"dataType":"array","array":{"dataType":"string"}},
            "productionStudios": {"dataType":"array","array":{"dataType":"string"}},
            "productionStudiosLock": {"dataType":"boolean"},
            "creator": {"dataType":"array","array":{"dataType":"string"}},
            "creatorLock": {"dataType":"boolean"},
            "musicComposer": {"dataType":"array","array":{"dataType":"string"}},
            "musicComposerLock": {"dataType":"boolean"},
            "genres": {"dataType":"array","array":{"dataType":"string"}},
            "genresLock": {"dataType":"boolean"},
            "preferAudioLan": {"dataType":"string"},
            "preferSubLan": {"dataType":"string"},
            "subsMode": {"dataType":"string"},
            "folder": {"dataType":"string"},
            "episodeGroupId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "analyzingFiles": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetSeriesWatchStateDTO": {
        "dataType": "refObject",
        "properties": {
            "watched": {"dataType":"boolean","required":true},
            "userId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TvResult": {
        "dataType": "refObject",
        "properties": {
            "poster_path": {"dataType":"string"},
            "popularity": {"dataType":"double"},
            "id": {"dataType":"double"},
            "overview": {"dataType":"string"},
            "backdrop_path": {"dataType":"string"},
            "vote_average": {"dataType":"double"},
            "media_type": {"dataType":"enum","enums":["tv"],"required":true},
            "first_air_date": {"dataType":"string"},
            "origin_country": {"dataType":"array","array":{"dataType":"string"}},
            "genre_ids": {"dataType":"array","array":{"dataType":"double"}},
            "original_language": {"dataType":"string"},
            "vote_count": {"dataType":"double"},
            "name": {"dataType":"string"},
            "original_name": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TvResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"TvResult"}},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Network": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "id": {"dataType":"double"},
            "logo_path": {"dataType":"string"},
            "origin_country": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TvEpisodeGroupsResponse": {
        "dataType": "refObject",
        "properties": {
            "results": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"network":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":[null]},{"ref":"Network"}]},"name":{"dataType":"string"},"id":{"dataType":"string"},"group_count":{"dataType":"double"},"episode_count":{"dataType":"double"},"description":{"dataType":"string"}}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TvEpisodeGroupsResponse-or-null_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"dataType":"union","subSchemas":[{"ref":"TvEpisodeGroupsResponse"},{"dataType":"enum","enums":[null]}]},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ServerUserDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "username": {"dataType":"string","required":true},
            "avatar": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ServerStatusResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "status": {"dataType":"string","required":true},
            "users": {"dataType":"array","array":{"dataType":"refObject","ref":"ServerUserDTO"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ServerStatusResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"ServerStatusResponse"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Server": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "httpPort": {"dataType":"double","required":true},
            "httpsPort": {"dataType":"double","required":true},
            "tunnelEnabled": {"dataType":"boolean","required":true},
            "tunnelUrl": {"dataType":"string"},
            "httpsEnabled": {"dataType":"boolean","required":true},
            "sslCertPath": {"dataType":"string"},
            "sslKeyPath": {"dataType":"string"},
            "sslPassword": {"dataType":"string"},
            "customUrl": {"dataType":"string"},
            "proxyHosts": {"dataType":"string"},
            "forceHttps": {"dataType":"boolean","required":true},
            "allowRemoteConnections": {"dataType":"boolean","required":true},
            "remoteIpFilter": {"dataType":"string"},
            "remoteIpFilterMode": {"dataType":"string","required":true},
            "enableAutoPortMapping": {"dataType":"boolean","required":true},
            "publicHttpPort": {"dataType":"double","required":true},
            "publicHttpsPort": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Server_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"Server"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateServerDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "httpPort": {"dataType":"double"},
            "httpsPort": {"dataType":"double"},
            "tunnelEnabled": {"dataType":"boolean"},
            "tunnelUrl": {"dataType":"string"},
            "httpsEnabled": {"dataType":"boolean"},
            "sslCertPath": {"dataType":"string"},
            "sslKeyPath": {"dataType":"string"},
            "sslPassword": {"dataType":"string"},
            "customUrl": {"dataType":"string"},
            "proxyHosts": {"dataType":"string"},
            "forceHttps": {"dataType":"boolean"},
            "allowRemoteConnections": {"dataType":"boolean"},
            "remoteIpFilter": {"dataType":"string"},
            "remoteIpFilterMode": {"dataType":"string"},
            "enableAutoPortMapping": {"dataType":"boolean"},
            "publicHttpPort": {"dataType":"double"},
            "publicHttpsPort": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ServerConfigResponse": {
        "dataType": "refObject",
        "properties": {
            "key": {"dataType":"string"},
            "value": {"dataType":"any"},
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ServerConfigResponse_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"ServerConfigResponse"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ServerConfigDTO": {
        "dataType": "refObject",
        "properties": {
            "autoScan": {"dataType":"boolean","required":true},
            "autoScanPeriod": {"dataType":"string","required":true},
            "generateChapters": {"dataType":"string","required":true},
            "autoSelectTracks": {"dataType":"boolean","required":true},
            "preferAudioLan": {"dataType":"string","required":true},
            "preferSubsLan": {"dataType":"string","required":true},
            "subsMode": {"dataType":"string","required":true},
            "tempTranscodeFolder": {"dataType":"string","required":true},
            "transcodeBuffer": {"dataType":"double","required":true},
            "transcodePreset": {"dataType":"string","required":true},
            "maxTranscodeProcesses": {"dataType":"double","required":true},
            "automaticUpdates": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ServerConfigDTO_": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"union","subSchemas":[{"ref":"ServerConfigDTO"},{"dataType":"enum","enums":[null]}],"required":true},
            "timestamp": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateServerConfigDTO": {
        "dataType": "refObject",
        "properties": {
            "autoScan": {"dataType":"boolean"},
            "autoScanPeriod": {"dataType":"string"},
            "generateChapters": {"dataType":"string"},
            "autoSelectTracks": {"dataType":"boolean"},
            "preferAudioLan": {"dataType":"string"},
            "preferSubsLan": {"dataType":"string"},
            "subsMode": {"dataType":"string"},
            "tempTranscodeFolder": {"dataType":"string"},
            "transcodeBuffer": {"dataType":"double"},
            "transcodePreset": {"dataType":"string"},
            "maxTranscodeProcesses": {"dataType":"double"},
            "automaticUpdates": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsWatchListController_updateWatchState: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"UpdateWatchStateDTO"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.patch('/api/watch-lists/watch-state',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WatchListController)),
            ...(fetchMiddlewares<RequestHandler>(WatchListController.prototype.updateWatchState)),

            async function WatchListController_updateWatchState(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWatchListController_updateWatchState, request, response });

                const controller = new WatchListController();

              await templateService.apiHandler({
                methodName: 'updateWatchState',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContinueWatchingController_getVideos: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/continue-watching',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContinueWatchingController)),
            ...(fetchMiddlewares<RequestHandler>(ContinueWatchingController.prototype.getVideos)),

            async function ContinueWatchingController_getVideos(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinueWatchingController_getVideos, request, response });

                const controller = new ContinueWatchingController();

              await templateService.apiHandler({
                methodName: 'getVideos',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideoStreamingController_getStreamUrl: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"StreamUrlDTO"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/video-streaming/transcoded-url',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideoStreamingController)),
            ...(fetchMiddlewares<RequestHandler>(VideoStreamingController.prototype.getStreamUrl)),

            async function VideoStreamingController_getStreamUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideoStreamingController_getStreamUrl, request, response });

                const controller = new VideoStreamingController();

              await templateService.apiHandler({
                methodName: 'getStreamUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideoStreamingController_getVideoUrl: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"VideoUrlDTO"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/video-streaming/passthrough-url',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideoStreamingController)),
            ...(fetchMiddlewares<RequestHandler>(VideoStreamingController.prototype.getVideoUrl)),

            async function VideoStreamingController_getVideoUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideoStreamingController_getVideoUrl, request, response });

                const controller = new VideoStreamingController();

              await templateService.apiHandler({
                methodName: 'getVideoUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideoStreamingController_streamVideo: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/video-streaming/transcoded',
            ...(fetchMiddlewares<RequestHandler>(VideoStreamingController)),
            ...(fetchMiddlewares<RequestHandler>(VideoStreamingController.prototype.streamVideo)),

            async function VideoStreamingController_streamVideo(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideoStreamingController_streamVideo, request, response });

                const controller = new VideoStreamingController();

              await templateService.apiHandler({
                methodName: 'streamVideo',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideoStreamingController_streamVideoFile: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/video-streaming/passthrough',
            ...(fetchMiddlewares<RequestHandler>(VideoStreamingController)),
            ...(fetchMiddlewares<RequestHandler>(VideoStreamingController.prototype.streamVideoFile)),

            async function VideoStreamingController_streamVideoFile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideoStreamingController_streamVideoFile, request, response });

                const controller = new VideoStreamingController();

              await templateService.apiHandler({
                methodName: 'streamVideoFile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_get: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/videos/:id',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.get)),

            async function VideosController_get(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_get, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_getByEpisodeId: Record<string, TsoaRoute.ParameterSchema> = {
                episodeId: {"in":"path","name":"episodeId","required":true,"dataType":"string"},
        };
        app.get('/api/videos/by-episode/:episodeId',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.getByEpisodeId)),

            async function VideosController_getByEpisodeId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_getByEpisodeId, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'getByEpisodeId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_getPlaybackInfo: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/videos/playback-info/:id',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.getPlaybackInfo)),

            async function VideosController_getPlaybackInfo(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_getPlaybackInfo, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'getPlaybackInfo',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateVideoDTO"},
        };
        app.patch('/api/videos/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.update)),

            async function VideosController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_update, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/videos/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.delete)),

            async function VideosController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_delete, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_updateMediaInfo: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/videos/:id/media-info',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.updateMediaInfo)),

            async function VideosController_updateMediaInfo(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_updateMediaInfo, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'updateMediaInfo',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_setWatchState: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"SetVideoWatchStateDTO"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/videos/:id/watch-state',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.setWatchState)),

            async function VideosController_setWatchState(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_setWatchState, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'setWatchState',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_getVideoThumbnail: Record<string, TsoaRoute.ParameterSchema> = {
                url: {"in":"query","name":"url","required":true,"dataType":"string"},
                time: {"in":"query","name":"time","dataType":"string"},
        };
        app.get('/api/videos/thumbnail',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.getVideoThumbnail)),

            async function VideosController_getVideoThumbnail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_getVideoThumbnail, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'getVideoThumbnail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVideosController_getSubsFromVideo: Record<string, TsoaRoute.ParameterSchema> = {
                videoPathParam: {"in":"query","name":"videoPathParam","required":true,"dataType":"string"},
                trackId: {"in":"query","name":"trackId","required":true,"dataType":"double"},
                startTime: {"in":"query","name":"startTime","dataType":"double"},
        };
        app.get('/api/videos/subtitles',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VideosController)),
            ...(fetchMiddlewares<RequestHandler>(VideosController.prototype.getSubsFromVideo)),

            async function VideosController_getSubsFromVideo(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVideosController_getSubsFromVideo, request, response });

                const controller = new VideosController();

              await templateService.apiHandler({
                methodName: 'getSubsFromVideo',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateUserDTO"},
        };
        app.post('/api/users',
            authenticateMiddleware([{"managementAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.create)),

            async function UsersController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_create, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateUserDTO"},
        };
        app.patch('/api/users/:id',
            authenticateMiddleware([{"managementAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.update)),

            async function UsersController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_update, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/users/:id',
            authenticateMiddleware([{"managementAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.delete)),

            async function UsersController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_delete, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_findAll: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/users/public',
            authenticateMiddleware([{"public":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.findAll)),

            async function UsersController_findAll(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_findAll, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'findAll',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_login: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"LoginDTO"},
        };
        app.post('/api/users/login',
            authenticateMiddleware([{"public":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.login)),

            async function UsersController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_login, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_logout: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.post('/api/users/logout',
            authenticateMiddleware([{"public":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.logout)),

            async function UsersController_logout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_logout, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'logout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSongsController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateSongDTO"},
        };
        app.patch('/api/songs/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SongsController)),
            ...(fetchMiddlewares<RequestHandler>(SongsController.prototype.update)),

            async function SongsController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSongsController_update, request, response });

                const controller = new SongsController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSongsController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/songs/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SongsController)),
            ...(fetchMiddlewares<RequestHandler>(SongsController.prototype.delete)),

            async function SongsController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSongsController_delete, request, response });

                const controller = new SongsController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSongsController_separateStems: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.post('/api/songs/:id/separate-stems',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SongsController)),
            ...(fetchMiddlewares<RequestHandler>(SongsController.prototype.separateStems)),

            async function SongsController_separateStems(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSongsController_separateStems, request, response });

                const controller = new SongsController();

              await templateService.apiHandler({
                methodName: 'separateStems',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 202,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSongsController_getSongsLyrics: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/songs/:id/lyrics',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SongsController)),
            ...(fetchMiddlewares<RequestHandler>(SongsController.prototype.getSongsLyrics)),

            async function SongsController_getSongsLyrics(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSongsController_getSongsLyrics, request, response });

                const controller = new SongsController();

              await templateService.apiHandler({
                methodName: 'getSongsLyrics',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSongsController_getSongUrl: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"SongUrlDTO"},
                isWeb: {"in":"query","name":"isWeb","dataType":"string"},
                isDesktop: {"in":"query","name":"isDesktop","dataType":"string"},
                isMobile: {"in":"query","name":"isMobile","dataType":"string"},
                req: {"in":"request","name":"req","dataType":"object"},
        };
        app.post('/api/songs/stream-url',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SongsController)),
            ...(fetchMiddlewares<RequestHandler>(SongsController.prototype.getSongUrl)),

            async function SongsController_getSongUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSongsController_getSongUrl, request, response });

                const controller = new SongsController();

              await templateService.apiHandler({
                methodName: 'getSongUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSongsController_streamAudio: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                isWeb: {"in":"query","name":"isWeb","dataType":"string"},
        };
        app.get('/api/songs/stream',
            ...(fetchMiddlewares<RequestHandler>(SongsController)),
            ...(fetchMiddlewares<RequestHandler>(SongsController.prototype.streamAudio)),

            async function SongsController_streamAudio(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSongsController_streamAudio, request, response });

                const controller = new SongsController();

              await templateService.apiHandler({
                methodName: 'streamAudio',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSearchController_searchDownloadableMedia: Record<string, TsoaRoute.ParameterSchema> = {
                query: {"in":"query","name":"query","required":true,"dataType":"string"},
        };
        app.get('/api/search/media',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SearchController)),
            ...(fetchMiddlewares<RequestHandler>(SearchController.prototype.searchDownloadableMedia)),

            async function SearchController_searchDownloadableMedia(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSearchController_searchDownloadableMedia, request, response });

                const controller = new SearchController();

              await templateService.apiHandler({
                methodName: 'searchDownloadableMedia',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMediaController_getDetails: Record<string, TsoaRoute.ParameterSchema> = {
                type: {"in":"path","name":"type","required":true,"dataType":"string"},
                id: {"in":"query","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/media/details/:type',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MediaController)),
            ...(fetchMiddlewares<RequestHandler>(MediaController.prototype.getDetails)),

            async function MediaController_getDetails(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMediaController_getDetails, request, response });

                const controller = new MediaController();

              await templateService.apiHandler({
                methodName: 'getDetails',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMediaController_getMediaBackground: Record<string, TsoaRoute.ParameterSchema> = {
                itemType: {"in":"path","name":"itemType","required":true,"dataType":"string"},
                mediaType: {"in":"path","name":"mediaType","required":true,"dataType":"string"},
                id: {"in":"query","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/media/:itemType/:mediaType',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MediaController)),
            ...(fetchMiddlewares<RequestHandler>(MediaController.prototype.getMediaBackground)),

            async function MediaController_getMediaBackground(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMediaController_getMediaBackground, request, response });

                const controller = new MediaController();

              await templateService.apiHandler({
                methodName: 'getMediaBackground',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_health: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/health',
            authenticateMiddleware([{"managementAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.health)),

            async function HealthController_health(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_health, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'health',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFilesController_getDrives: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/files/drives',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FilesController)),
            ...(fetchMiddlewares<RequestHandler>(FilesController.prototype.getDrives)),

            async function FilesController_getDrives(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFilesController_getDrives, request, response });

                const controller = new FilesController();

              await templateService.apiHandler({
                methodName: 'getDrives',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFilesController_getFolderContents: Record<string, TsoaRoute.ParameterSchema> = {
                path: {"in":"query","name":"path","required":true,"dataType":"string"},
        };
        app.get('/api/files/folder',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FilesController)),
            ...(fetchMiddlewares<RequestHandler>(FilesController.prototype.getFolderContents)),

            async function FilesController_getFolderContents(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFilesController_getFolderContents, request, response });

                const controller = new FilesController();

              await templateService.apiHandler({
                methodName: 'getFolderContents',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDownloadController_downloadVideo: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"DownloadVideoDTO"},
        };
        app.post('/api/downloads/video',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DownloadController)),
            ...(fetchMiddlewares<RequestHandler>(DownloadController.prototype.downloadVideo)),

            async function DownloadController_downloadVideo(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDownloadController_downloadVideo, request, response });

                const controller = new DownloadController();

              await templateService.apiHandler({
                methodName: 'downloadVideo',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDownloadController_downloadMusic: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"DownloadMusicDTO"},
        };
        app.post('/api/downloads/music',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DownloadController)),
            ...(fetchMiddlewares<RequestHandler>(DownloadController.prototype.downloadMusic)),

            async function DownloadController_downloadMusic(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDownloadController_downloadMusic, request, response });

                const controller = new DownloadController();

              await templateService.apiHandler({
                methodName: 'downloadMusic',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDownloadController_downloadImage: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"DownloadImageDTO"},
        };
        app.post('/api/downloads/image',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DownloadController)),
            ...(fetchMiddlewares<RequestHandler>(DownloadController.prototype.downloadImage)),

            async function DownloadController_downloadImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDownloadController_downloadImage, request, response });

                const controller = new DownloadController();

              await templateService.apiHandler({
                methodName: 'downloadImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAPIKeyController_configureApiKey: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"APIKeyDTO"},
        };
        app.post('/api/configuration/api-key',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(APIKeyController)),
            ...(fetchMiddlewares<RequestHandler>(APIKeyController.prototype.configureApiKey)),

            async function APIKeyController_configureApiKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAPIKeyController_configureApiKey, request, response });

                const controller = new APIKeyController();

              await templateService.apiHandler({
                methodName: 'configureApiKey',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAlbumsController_get: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/albums/:id',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AlbumsController)),
            ...(fetchMiddlewares<RequestHandler>(AlbumsController.prototype.get)),

            async function AlbumsController_get(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAlbumsController_get, request, response });

                const controller = new AlbumsController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAlbumsController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateAlbumDTO"},
        };
        app.patch('/api/albums/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AlbumsController)),
            ...(fetchMiddlewares<RequestHandler>(AlbumsController.prototype.update)),

            async function AlbumsController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAlbumsController_update, request, response });

                const controller = new AlbumsController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAlbumsController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/albums/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AlbumsController)),
            ...(fetchMiddlewares<RequestHandler>(AlbumsController.prototype.delete)),

            async function AlbumsController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAlbumsController_delete, request, response });

                const controller = new AlbumsController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsArtistsController_getById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/artists/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ArtistsController)),
            ...(fetchMiddlewares<RequestHandler>(ArtistsController.prototype.getById)),

            async function ArtistsController_getById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsArtistsController_getById, request, response });

                const controller = new ArtistsController();

              await templateService.apiHandler({
                methodName: 'getById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsArtistsController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateArtistDTO"},
        };
        app.patch('/api/artists/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ArtistsController)),
            ...(fetchMiddlewares<RequestHandler>(ArtistsController.prototype.update)),

            async function ArtistsController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsArtistsController_update, request, response });

                const controller = new ArtistsController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCollectionsController_getMusicExtras: Record<string, TsoaRoute.ParameterSchema> = {
                collectionId: {"in":"path","name":"collectionId","required":true,"dataType":"string"},
        };
        app.get('/api/collections/:collectionId/music-extras',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController)),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController.prototype.getMusicExtras)),

            async function CollectionsController_getMusicExtras(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCollectionsController_getMusicExtras, request, response });

                const controller = new CollectionsController();

              await templateService.apiHandler({
                methodName: 'getMusicExtras',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCollectionsController_getCollectionContent: Record<string, TsoaRoute.ParameterSchema> = {
                collectionId: {"in":"path","name":"collectionId","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/collections/:collectionId/content',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController)),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController.prototype.getCollectionContent)),

            async function CollectionsController_getCollectionContent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCollectionsController_getCollectionContent, request, response });

                const controller = new CollectionsController();

              await templateService.apiHandler({
                methodName: 'getCollectionContent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCollectionsController_reorderContent: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ReorderContentDTO"},
        };
        app.post('/api/collections/:id/items/order',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController)),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController.prototype.reorderContent)),

            async function CollectionsController_reorderContent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCollectionsController_reorderContent, request, response });

                const controller = new CollectionsController();

              await templateService.apiHandler({
                methodName: 'reorderContent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCollectionsController_get: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/collections/:id',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController)),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController.prototype.get)),

            async function CollectionsController_get(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCollectionsController_get, request, response });

                const controller = new CollectionsController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCollectionsController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateCollectionDTO"},
        };
        app.patch('/api/collections/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController)),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController.prototype.update)),

            async function CollectionsController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCollectionsController_update, request, response });

                const controller = new CollectionsController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCollectionsController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/collections/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController)),
            ...(fetchMiddlewares<RequestHandler>(CollectionsController.prototype.delete)),

            async function CollectionsController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCollectionsController_delete, request, response });

                const controller = new CollectionsController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEpisodesController_get: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/episodes/:id',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EpisodesController)),
            ...(fetchMiddlewares<RequestHandler>(EpisodesController.prototype.get)),

            async function EpisodesController_get(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEpisodesController_get, request, response });

                const controller = new EpisodesController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEpisodesController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateEpisodeDTO"},
        };
        app.patch('/api/episodes/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EpisodesController)),
            ...(fetchMiddlewares<RequestHandler>(EpisodesController.prototype.update)),

            async function EpisodesController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEpisodesController_update, request, response });

                const controller = new EpisodesController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEpisodesController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/episodes/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EpisodesController)),
            ...(fetchMiddlewares<RequestHandler>(EpisodesController.prototype.delete)),

            async function EpisodesController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEpisodesController_delete, request, response });

                const controller = new EpisodesController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsEpisodesController_setWatchState: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"SetEpisodeWatchStateDTO"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/episodes/:id/watch-state',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EpisodesController)),
            ...(fetchMiddlewares<RequestHandler>(EpisodesController.prototype.setWatchState)),

            async function EpisodesController_setWatchState(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEpisodesController_setWatchState, request, response });

                const controller = new EpisodesController();

              await templateService.apiHandler({
                methodName: 'setWatchState',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImagesController_uploadImage: Record<string, TsoaRoute.ParameterSchema> = {
                destPath: {"in":"formData","name":"destPath","required":true,"dataType":"string"},
                image: {"in":"formData","name":"image","required":true,"dataType":"file"},
        };
        app.post('/api/images',
            authenticateMiddleware([{"cookieAuthFast":[]}]),
            upload.fields([
                {
                    name: "image",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(ImagesController)),
            ...(fetchMiddlewares<RequestHandler>(ImagesController.prototype.uploadImage)),

            async function ImagesController_uploadImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImagesController_uploadImage, request, response });

                const controller = new ImagesController();

              await templateService.apiHandler({
                methodName: 'uploadImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImagesController_getDirectoryListing: Record<string, TsoaRoute.ParameterSchema> = {
                path: {"in":"query","name":"path","required":true,"dataType":"string"},
        };
        app.get('/api/images',
            authenticateMiddleware([{"cookieAuthFast":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ImagesController)),
            ...(fetchMiddlewares<RequestHandler>(ImagesController.prototype.getDirectoryListing)),

            async function ImagesController_getDirectoryListing(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImagesController_getDirectoryListing, request, response });

                const controller = new ImagesController();

              await templateService.apiHandler({
                methodName: 'getDirectoryListing',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImagesController_getLocalImage: Record<string, TsoaRoute.ParameterSchema> = {
                path: {"in":"query","name":"path","required":true,"dataType":"string"},
                width: {"in":"query","name":"width","dataType":"double"},
                height: {"in":"query","name":"height","dataType":"double"},
                req: {"in":"request","name":"req","dataType":"object"},
        };
        app.get('/api/images/local',
            authenticateMiddleware([{"cookieAuthFast":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ImagesController)),
            ...(fetchMiddlewares<RequestHandler>(ImagesController.prototype.getLocalImage)),

            async function ImagesController_getLocalImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImagesController_getLocalImage, request, response });

                const controller = new ImagesController();

              await templateService.apiHandler({
                methodName: 'getLocalImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImagesController_getRemoteImage: Record<string, TsoaRoute.ParameterSchema> = {
                url: {"in":"query","name":"url","required":true,"dataType":"string"},
                width: {"in":"query","name":"width","dataType":"double"},
                height: {"in":"query","name":"height","dataType":"double"},
                req: {"in":"request","name":"req","dataType":"object"},
        };
        app.get('/api/images/compressed',
            authenticateMiddleware([{"cookieAuthFast":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ImagesController)),
            ...(fetchMiddlewares<RequestHandler>(ImagesController.prototype.getRemoteImage)),

            async function ImagesController_getRemoteImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImagesController_getRemoteImage, request, response });

                const controller = new ImagesController();

              await templateService.apiHandler({
                methodName: 'getRemoteImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImagesController_getImageColorPalette: Record<string, TsoaRoute.ParameterSchema> = {
                url: {"in":"query","name":"url","dataType":"string"},
                localPath: {"in":"query","name":"localPath","dataType":"string"},
                minLight: {"in":"query","name":"minLight","dataType":"double"},
                maxLight: {"in":"query","name":"maxLight","dataType":"double"},
                sat: {"in":"query","name":"sat","dataType":"double"},
        };
        app.get('/api/images/colors',
            authenticateMiddleware([{"cookieAuthFast":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ImagesController)),
            ...(fetchMiddlewares<RequestHandler>(ImagesController.prototype.getImageColorPalette)),

            async function ImagesController_getImageColorPalette(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImagesController_getImageColorPalette, request, response });

                const controller = new ImagesController();

              await templateService.apiHandler({
                methodName: 'getImageColorPalette',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImagesController_createTransparentImage: Record<string, TsoaRoute.ParameterSchema> = {
                width: {"in":"query","name":"width","required":true,"dataType":"double"},
                height: {"in":"query","name":"height","required":true,"dataType":"double"},
                url: {"in":"query","name":"url","dataType":"string"},
                localPath: {"in":"query","name":"localPath","dataType":"string"},
        };
        app.get('/api/images/effects/transparent',
            authenticateMiddleware([{"cookieAuthFast":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ImagesController)),
            ...(fetchMiddlewares<RequestHandler>(ImagesController.prototype.createTransparentImage)),

            async function ImagesController_createTransparentImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImagesController_createTransparentImage, request, response });

                const controller = new ImagesController();

              await templateService.apiHandler({
                methodName: 'createTransparentImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImagesController_getAnimatedArtwork: Record<string, TsoaRoute.ParameterSchema> = {
                localPath: {"in":"query","name":"localPath","required":true,"dataType":"string"},
                variant: {"in":"query","name":"variant","dataType":"union","subSchemas":[{"dataType":"enum","enums":["square"]},{"dataType":"enum","enums":["tall"]}]},
                req: {"in":"request","name":"req","dataType":"object"},
        };
        app.get('/api/images/animated-artwork',
            authenticateMiddleware([{"cookieAuthFast":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ImagesController)),
            ...(fetchMiddlewares<RequestHandler>(ImagesController.prototype.getAnimatedArtwork)),

            async function ImagesController_getAnimatedArtwork(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImagesController_getAnimatedArtwork, request, response });

                const controller = new ImagesController();

              await templateService.apiHandler({
                methodName: 'getAnimatedArtwork',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_getAll: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/libraries',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.getAll)),

            async function LibrariesController_getAll(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_getAll, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'getAll',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_getById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/libraries/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.getById)),

            async function LibrariesController_getById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_getById, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'getById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_getContent: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                watched: {"in":"query","name":"watched","dataType":"boolean"},
        };
        app.get('/api/libraries/:id/content',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.getContent)),

            async function LibrariesController_getContent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_getContent, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'getContent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_startScan: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/libraries/:id/scan',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.startScan)),

            async function LibrariesController_startScan(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_startScan, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'startScan',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateLibraryDTO"},
        };
        app.post('/api/libraries',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.create)),

            async function LibrariesController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_create, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateLibraryDTO"},
        };
        app.patch('/api/libraries/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.update)),

            async function LibrariesController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_update, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/libraries/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.delete)),

            async function LibrariesController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_delete, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_reorder: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"ReorderLibrariesDTO"},
        };
        app.post('/api/libraries/order',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.reorder)),

            async function LibrariesController_reorder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_reorder, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'reorder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLibrariesController_reorderItems: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ReorderItemsDTO"},
        };
        app.post('/api/libraries/:id/order',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController)),
            ...(fetchMiddlewares<RequestHandler>(LibrariesController.prototype.reorderItems)),

            async function LibrariesController_reorderItems(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLibrariesController_reorderItems, request, response });

                const controller = new LibrariesController();

              await templateService.apiHandler({
                methodName: 'reorderItems',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_refreshMovieMetadata: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.post('/api/movies/:id/metadata',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.refreshMovieMetadata)),

            async function MoviesController_refreshMovieMetadata(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_refreshMovieMetadata, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'refreshMovieMetadata',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_changeIdentification: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ChangeIdentificationDTO"},
        };
        app.post('/api/movies/:id/identification',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.changeIdentification)),

            async function MoviesController_changeIdentification(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_changeIdentification, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'changeIdentification',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateMovieDTO"},
        };
        app.patch('/api/movies/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.update)),

            async function MoviesController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_update, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/movies/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.delete)),

            async function MoviesController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_delete, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_setWatchState: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"SetMovieWatchStateDTO"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/movies/:id/watch-state',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.setWatchState)),

            async function MoviesController_setWatchState(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_setWatchState, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'setWatchState',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_get: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/movies/:id',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.get)),

            async function MoviesController_get(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_get, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_searchMovies: Record<string, TsoaRoute.ParameterSchema> = {
                name: {"in":"query","name":"name","required":true,"dataType":"string"},
                year: {"in":"query","name":"year","dataType":"string"},
        };
        app.get('/api/movies/search',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.searchMovies)),

            async function MoviesController_searchMovies(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_searchMovies, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'searchMovies',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_getImdbScore: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"query","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/movies/imdb-score',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.getImdbScore)),

            async function MoviesController_getImdbScore(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_getImdbScore, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'getImdbScore',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMoviesController_getRemainingVideos: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/movies/:id/remaining-videos',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MoviesController)),
            ...(fetchMiddlewares<RequestHandler>(MoviesController.prototype.getRemainingVideos)),

            async function MoviesController_getRemainingVideos(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMoviesController_getRemainingVideos, request, response });

                const controller = new MoviesController();

              await templateService.apiHandler({
                methodName: 'getRemainingVideos',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayListController_getAll: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/playlists',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayListController)),
            ...(fetchMiddlewares<RequestHandler>(PlayListController.prototype.getAll)),

            async function PlayListController_getAll(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayListController_getAll, request, response });

                const controller = new PlayListController();

              await templateService.apiHandler({
                methodName: 'getAll',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayListController_getById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/playlists/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayListController)),
            ...(fetchMiddlewares<RequestHandler>(PlayListController.prototype.getById)),

            async function PlayListController_getById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayListController_getById, request, response });

                const controller = new PlayListController();

              await templateService.apiHandler({
                methodName: 'getById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayListController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreatePlayListDTO"},
        };
        app.post('/api/playlists',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayListController)),
            ...(fetchMiddlewares<RequestHandler>(PlayListController.prototype.create)),

            async function PlayListController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayListController_create, request, response });

                const controller = new PlayListController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayListController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdatePlayListDTO"},
        };
        app.patch('/api/playlists/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayListController)),
            ...(fetchMiddlewares<RequestHandler>(PlayListController.prototype.update)),

            async function PlayListController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayListController_update, request, response });

                const controller = new PlayListController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayListController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/playlists/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayListController)),
            ...(fetchMiddlewares<RequestHandler>(PlayListController.prototype.delete)),

            async function PlayListController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayListController_delete, request, response });

                const controller = new PlayListController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayListController_addSong: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"AddSongToPlaylistDTO"},
        };
        app.post('/api/playlists/:id/songs',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayListController)),
            ...(fetchMiddlewares<RequestHandler>(PlayListController.prototype.addSong)),

            async function PlayListController_addSong(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayListController_addSong, request, response });

                const controller = new PlayListController();

              await templateService.apiHandler({
                methodName: 'addSong',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPlayListController_removeSong: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                songId: {"in":"path","name":"songId","required":true,"dataType":"string"},
        };
        app.delete('/api/playlists/:id/songs/:songId',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlayListController)),
            ...(fetchMiddlewares<RequestHandler>(PlayListController.prototype.removeSong)),

            async function PlayListController_removeSong(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlayListController_removeSong, request, response });

                const controller = new PlayListController();

              await templateService.apiHandler({
                methodName: 'removeSong',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeasonsController_get: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                include: {"in":"query","name":"include","ref":"IncludeType"},
        };
        app.get('/api/seasons/:id',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeasonsController)),
            ...(fetchMiddlewares<RequestHandler>(SeasonsController.prototype.get)),

            async function SeasonsController_get(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeasonsController_get, request, response });

                const controller = new SeasonsController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeasonsController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateSeasonDTO"},
        };
        app.patch('/api/seasons/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeasonsController)),
            ...(fetchMiddlewares<RequestHandler>(SeasonsController.prototype.update)),

            async function SeasonsController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeasonsController_update, request, response });

                const controller = new SeasonsController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeasonsController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/seasons/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeasonsController)),
            ...(fetchMiddlewares<RequestHandler>(SeasonsController.prototype.delete)),

            async function SeasonsController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeasonsController_delete, request, response });

                const controller = new SeasonsController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeasonsController_setWatchState: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"SetSeasonWatchStateDTO"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/seasons/:id/watch-state',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeasonsController)),
            ...(fetchMiddlewares<RequestHandler>(SeasonsController.prototype.setWatchState)),

            async function SeasonsController_setWatchState(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeasonsController_setWatchState, request, response });

                const controller = new SeasonsController();

              await templateService.apiHandler({
                methodName: 'setWatchState',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_refreshMetadata: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"RefreshMetadataDTO"},
        };
        app.post('/api/series/metadata',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.refreshMetadata)),

            async function SeriesController_refreshMetadata(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_refreshMetadata, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'refreshMetadata',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_updateShowId: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"UpdateShowIdDTO"},
        };
        app.post('/api/series/tmdb-id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.updateShowId)),

            async function SeriesController_updateShowId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_updateShowId, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'updateShowId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_updateEpisodeGroup: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateEpisodeGroupDTO"},
        };
        app.post('/api/series/:id/episode-group',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.updateEpisodeGroup)),

            async function SeriesController_updateEpisodeGroup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_updateEpisodeGroup, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'updateEpisodeGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateSeriesDTO"},
        };
        app.patch('/api/series/show/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.update)),

            async function SeriesController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_update, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/series/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.delete)),

            async function SeriesController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_delete, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_setWatchState: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"SetSeriesWatchStateDTO"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/series/:id/watch-state',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.setWatchState)),

            async function SeriesController_setWatchState(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_setWatchState, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'setWatchState',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_get: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                include: {"in":"query","name":"include","ref":"IncludeType"},
        };
        app.get('/api/series/:id',
            authenticateMiddleware([{"cookieAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.get)),

            async function SeriesController_get(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_get, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'get',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_searchSeries: Record<string, TsoaRoute.ParameterSchema> = {
                name: {"in":"query","name":"name","required":true,"dataType":"string"},
                year: {"in":"query","name":"year","dataType":"string"},
        };
        app.get('/api/series/search',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.searchSeries)),

            async function SeriesController_searchSeries(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_searchSeries, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'searchSeries',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_searchEpisodeGroups: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"query","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/series/episode-groups/search',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.searchEpisodeGroups)),

            async function SeriesController_searchEpisodeGroups(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_searchEpisodeGroups, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'searchEpisodeGroups',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSeriesController_getRemainingEpisodes: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/series/:id/remaining-episodes',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SeriesController)),
            ...(fetchMiddlewares<RequestHandler>(SeriesController.prototype.getRemainingEpisodes)),

            async function SeriesController_getRemainingEpisodes(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSeriesController_getRemainingEpisodes, request, response });

                const controller = new SeriesController();

              await templateService.apiHandler({
                methodName: 'getRemainingEpisodes',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsServersController_getServerStatus: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/servers',
            ...(fetchMiddlewares<RequestHandler>(ServersController)),
            ...(fetchMiddlewares<RequestHandler>(ServersController.prototype.getServerStatus)),

            async function ServersController_getServerStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsServersController_getServerStatus, request, response });

                const controller = new ServersController();

              await templateService.apiHandler({
                methodName: 'getServerStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsServersController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateServerDTO"},
        };
        app.patch('/api/servers/:id',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ServersController)),
            ...(fetchMiddlewares<RequestHandler>(ServersController.prototype.update)),

            async function ServersController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsServersController_update, request, response });

                const controller = new ServersController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsServersController_getServerConfigKey: Record<string, TsoaRoute.ParameterSchema> = {
                key: {"in":"path","name":"key","required":true,"dataType":"string"},
        };
        app.get('/api/servers/config/:key',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ServersController)),
            ...(fetchMiddlewares<RequestHandler>(ServersController.prototype.getServerConfigKey)),

            async function ServersController_getServerConfigKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsServersController_getServerConfigKey, request, response });

                const controller = new ServersController();

              await templateService.apiHandler({
                methodName: 'getServerConfigKey',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsServersController_getServerConfig: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/servers/config',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ServersController)),
            ...(fetchMiddlewares<RequestHandler>(ServersController.prototype.getServerConfig)),

            async function ServersController_getServerConfig(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsServersController_getServerConfig, request, response });

                const controller = new ServersController();

              await templateService.apiHandler({
                methodName: 'getServerConfig',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsServersController_updateServerConfig: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"UpdateServerConfigDTO"},
        };
        app.patch('/api/servers/config',
            authenticateMiddleware([{"adminAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ServersController)),
            ...(fetchMiddlewares<RequestHandler>(ServersController.prototype.updateServerConfig)),

            async function ServersController_updateServerConfig(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsServersController_updateServerConfig, request, response });

                const controller = new ServersController();

              await templateService.apiHandler({
                methodName: 'updateServerConfig',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
