import fs from 'node:fs';
import axios from 'axios';

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
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    return new Promise<void>((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
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
