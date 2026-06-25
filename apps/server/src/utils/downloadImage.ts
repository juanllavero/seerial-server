import https from 'node:https';
import http from 'node:http';
import path from 'node:path';
import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { isSafePublicHttpUrl } from './network-security';

const MAX_REDIRECTS = 5;

/**
 * Downloads a remote image URL and saves it to the given destination path.
 * Ensures the parent directory exists before writing.
 */
export async function downloadImage(url: string, destPath: string): Promise<void> {
  return downloadImageWithRedirects(url, destPath, 0);
}

async function downloadImageWithRedirects(
  url: string,
  destPath: string,
  redirectCount: number,
): Promise<void> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error(`Too many redirects while downloading ${url}`);
  }

  if (!(await isSafePublicHttpUrl(url))) {
    throw new Error(`Blocked remote URL: ${url}`);
  }

  fileSystemService.createFolder(path.dirname(destPath));

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fileSystemService.createWriteStream(destPath);

    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        fileSystemService.deleteFile(destPath);
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          reject(new Error(`Redirect with no location header from ${url}`));
          return;
        }
        downloadImageWithRedirects(redirectUrl, destPath, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        fileSystemService.deleteFile(destPath);
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => resolve());
      file.on('error', (err) => {
        fileSystemService.deleteFile(destPath);
        reject(err);
      });
    });

    request.on('error', (err) => {
      fileSystemService.deleteFile(destPath);
      reject(err);
    });
  });
}

/**
 * Returns true if the given string is a remote HTTP/HTTPS URL.
 */
export function isRemoteUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}
