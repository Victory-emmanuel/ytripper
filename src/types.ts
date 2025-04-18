/**
 * Represents available download formats.
 */
export type DownloadFormat = 'mp3' | 'mp4';

/**
 * Represents available video qualities.
 */
export type VideoQuality = '360p' | '480p' | '720p' | '1080p';

/**
 * Represents available audio qualities.
 */
export type AudioQuality = '128kbps' | '192kbps' | '256kbps' | '320kbps';

/**
 * Represents the progress of a download.
 */
export interface DownloadProgress {
  /**
   * The percentage of the download that is complete.
   */
  percentage: number;

  /**
   * The current status message.
   */
  status: string;
}