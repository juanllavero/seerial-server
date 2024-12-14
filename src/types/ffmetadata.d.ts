declare module 'ffmetadata' {
  interface Metadata {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    track?: string;
    date?: string;
    comment?: string;
    composer?: string;
    [key: string]: any;  // Allow other metadata fields
  }

  interface ReadOptions {
    coverPath?: string;
  }

  interface WriteOptions {
    attachments?: string[];
  }

  /**
   * Reads metadata from an audio file.
   * @param filePath The path to the audio file.
   * @param options Optional. Additional options for reading metadata.
   * @param callback Callback function with the error or the read metadata.
   */
  function read(
    filePath: string,
    options: ReadOptions,
    callback: (err: Error | null, data: Metadata) => void
  ): void;

  /**
   * Reads metadata from an audio file.
   * @param filePath The path to the audio file.
   * @param callback Callback function with the error or the read metadata.
   */
  function read(
    filePath: string,
    callback: (err: Error | null, data: Metadata) => void
  ): void;

  /**
   * Writes metadata to an audio file.
   * @param filePath The path to the audio file.
   * @param data The metadata to be written.
   * @param options Optional. Additional options for writing metadata.
   * @param callback Callback function handling the error or confirmation.
   */
  function write(
    filePath: string,
    data: Metadata,
    options: WriteOptions,
    callback: (err: Error | null) => void
  ): void;

  /**
   * Writes metadata to an audio file.
   * @param filePath The path to the audio file.
   * @param data The metadata to be written.
   * @param callback Callback function handling the error or confirmation.
   */
  function write(
    filePath: string,
    data: Metadata,
    callback: (err: Error | null) => void
  ): void;

  /**
   * Sets the custom path for ffmpeg.
   * @param path The path to the ffmpeg binary.
   */
  function setFfmpegPath(path: string): void;
}
