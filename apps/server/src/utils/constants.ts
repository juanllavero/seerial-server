import os from 'node:os';
import path from 'node:path';

export const APP_NAME = 'Seerial Media Server';
export const APP_VERSION = '0.1.0';
export const LOCAL_DATA_PATH = path.join(
  os.homedir(),
  process.platform === 'win32'
    ? 'AppData\\Local'
    : process.platform === 'darwin'
      ? 'Library/Application Support'
      : process.platform === 'linux'
        ? '.config'
        : '',
  APP_NAME,
);

export const initFolders: string[] = [
  'resources/',
  'resources/config',
  'resources/img/',
  'resources/img/posters/',
  'resources/img/logos/',
  'resources/img/backgrounds/',
  'resources/img/thumbnails/',
  'resources/img/thumbnails/video/',
  'resources/img/thumbnails/chapters/',
  'resources/img/DownloadCache/',
  'resources/music/',
  'resources/videos/',
];

export enum UserType {
  NORMAL = 'normal',
  ADMIN = 'admin',
}

export const extraTypes = ['behindthescenes', 'concert', 'interview', 'live', 'lyrics', 'video'];
export const videoExtensions = [
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.mpeg',
  '.m2ts',
  '.webm',
];
export const audioExtensions = [
  '.mp3',
  '.flac',
  '.wav',
  '.m4a',
  '.opus',
  '.ogg',
  '.aac',
  '.wma',
  '.webm',
  '.caf',
];
export const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
