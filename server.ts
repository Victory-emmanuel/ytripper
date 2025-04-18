import express from 'express';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { PassThrough } from 'stream';
import cors from 'cors';
import type { DownloadFormat, VideoQuality, AudioQuality, DownloadProgress } from './src/types';

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

/**
 * Asynchronously converts a YouTube video to the specified format and quality.
 *
 * @param url The YouTube video URL.
 * @param format The desired download format (mp3 or mp4).
 * @param videoQuality The desired video quality (360p, 480p, 720p, 1080p).  Only applicable for mp4 format.
 * @param audioQuality The desired audio quality (128kbps, 192kbps, 256kbps, 320kbps). Only applicable for mp3 format.
 * @param progressCallback A callback function to report download progress.
 * @returns A promise that resolves to a ReadableStream of the converted file.
 */
export async function convertYouTubeVideo(
  url: string,
  format: DownloadFormat,
  videoQuality?: VideoQuality,
  audioQuality?: AudioQuality,
  progressCallback?: (progress: DownloadProgress) => void,
): Promise<NodeJS.ReadableStream> {
  if (progressCallback) {
    progressCallback({ percentage: 0, status: 'Fetching video info...' });
  }
  const info = await ytdl.getInfo(url);

  const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
  let videoStream: PassThrough | undefined;
  let audioStream: PassThrough | undefined;
  let bestVideoFormat: ytdl.videoFormat | undefined;
  let bestAudioFormat: ytdl.videoFormat | undefined;

  if (format === 'mp4') {
    bestVideoFormat = ytdl.chooseFormat(info.formats, {
      quality: videoQuality ?? 'highest',
      filter: 'videoonly',
    });

    bestAudioFormat = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    if (!bestVideoFormat || !bestAudioFormat) {
      throw new Error('Could not find suitable video and audio formats.');
    }

    videoStream = new PassThrough();
    audioStream = new PassThrough();

    ytdl(url, { format: bestVideoFormat })
      .on('progress', (_, downloaded, total) => {
        const percentage = (downloaded / total) * 50;
        if (progressCallback) {
          progressCallback({
            percentage,
            status: `Downloading video: ${percentage.toFixed(2)}%`,
          });
        }
      })
      .pipe(videoStream);

    ytdl(url, { format: bestAudioFormat })
      .on('progress', (_, downloaded, total) => {
        const percentage = 50 + (downloaded / total) * 50;
        if (progressCallback) {
          progressCallback({
            percentage,
            status: `Downloading audio: ${percentage.toFixed(2)}%`,
          });
        }
      })
      .pipe(audioStream);
  }

  const outputStream = new PassThrough();

  if (format === 'mp4' && videoStream && audioStream) {
    if (progressCallback) {
      progressCallback({ percentage: 0, status: 'Muxing audio and video...' });
    }

    ffmpeg({ stdout: true, stderr: true })
      .setFfmpegPath(ffmpegPath)
      .input(videoStream)
      .input(audioStream)
      .videoCodec('copy')
      .audioCodec('copy')
      .format('mp4')
      .on('end', () => {
        if (progressCallback) {
          progressCallback({ percentage: 100, status: 'Finalizing...' });
        }
        outputStream.end();
      })
      .on('error', (err) => {
        console.error('Error during muxing:', err);
        outputStream.emit('error', err);
      })
      .pipe(outputStream, { end: true });
  } else if (format === 'mp3') {
    bestAudioFormat = ytdl.chooseFormat(info.formats, {
      quality: audioQuality ?? 'highestaudio',
      filter: 'audioonly',
    });
    if (!bestAudioFormat) {
      throw new Error('Could not find a suitable audio format.');
    }
    if (progressCallback) {
      progressCallback({ percentage: 0, status: 'Downloading and converting audio...' });
    }

    ffmpeg({ stdout: true, stderr: true })
      .setFfmpegPath(ffmpegPath)
      .input(ytdl(url, { format: bestAudioFormat }))
      .audioCodec('libmp3lame')
      .audioBitrate(audioQuality ?? '320k')
      .toFormat('mp3')
      .on('end', () => {
        if (progressCallback) {
          progressCallback({ percentage: 100, status: 'Finalizing...' });
        }
        outputStream.end();
      })
      .on('error', (err) => {
        console.error('Error during conversion:', err);
        outputStream.emit('error', err);
      })
      .pipe(outputStream, { end: true });
  }
  return outputStream;
}

app.post('/api/youtube', async (req, res) => {
  const { url, format, videoQuality, audioQuality } = req.body;

  if (!url || !format) {
    return res.status(400).json({ message: 'Missing url or format' });
  }

  try {
    const stream = await convertYouTubeVideo(
      url,
      format as DownloadFormat,
      videoQuality as VideoQuality,
      audioQuality as AudioQuality,
      undefined // progressCallback not needed in api endpoint
    );

    if (format === 'mp4') {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (format === 'mp3') {
      res.setHeader('Content-Type', 'audio/mpeg');
    }

    stream.pipe(res);
  } catch (error: any) {
    console.error('Error in API endpoint:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});