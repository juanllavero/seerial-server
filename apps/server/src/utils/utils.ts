import axios from 'axios';
import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { isSafePublicHttpUrl } from '@/utils/network-security';

/**
 * Checks if a string is a valid URL
 * @param urlString string representing the URL
 * @returns
 */
export const isValidURL = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_error) {
    return false;
  }
};

export const downloadImage = async (url: string, filePath: string) => {
  if (!(await isSafePublicHttpUrl(url))) {
    throw new Error('Blocked remote URL');
  }

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 10000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
      maxRedirects: 3,
    });

    return new Promise<void>((resolve, reject) => {
      const writer = fileSystemService.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error: unknown) {
    throw new Error(
      `Error downloading image: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const getFileName = (filePath: string) => {
  const fileNameWithExtension = filePath.split(/[/\\]/).pop() || '';
  const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.') || fileNameWithExtension;
  return fileName;
};
