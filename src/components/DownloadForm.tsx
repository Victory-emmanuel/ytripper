import React, { useState, useRef } from 'react';
import {
  DownloadFormat,
  VideoQuality,
  AudioQuality,
  DownloadProgress,
} from '../types';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';

export default function DownloadForm() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<DownloadFormat>('mp4');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('720p');
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('192kbps');
  const [progress, setProgress] = useState<DownloadProgress>({
    percentage: 0,
    status: 'Ready',
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const handleDownload = async () => {
    setProgress({ percentage: 0, status: 'Fetching video info...' });
    setDownloadUrl(null);

    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format, videoQuality, audioQuality }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const stream = new ReadableStream({
        start(controller) {
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              push();
            });
          }
          push();
        },
      });

      const blob = await new Response(stream).blob();
      const blobUrl = URL.createObjectURL(blob);
      setDownloadUrl(blobUrl);
      setProgress({ percentage: 100, status: 'Finalizing...' });
      
    } catch (error: any) {
      console.error('Download error:', error);
      setProgress({ percentage: 0, status: error.message || 'Error during download' });
    }
  };

  return (
    <Card className="w-[500px] p-4">
      <CardHeader>
        <CardTitle>YouTube Downloader</CardTitle>
        <CardDescription>Download YouTube videos in MP4 or MP3 format.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">YouTube URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="format">Format</Label>
          <Select onValueChange={(value) => setFormat(value as DownloadFormat)} defaultValue={format}>
            <SelectTrigger id="format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp4">MP4</SelectItem>
              <SelectItem value="mp3">MP3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {format === 'mp4' && (
          <div className="space-y-2">
            <Label htmlFor="videoQuality">Video Quality</Label>
            <Select
              onValueChange={(value) => setVideoQuality(value as VideoQuality)}
              defaultValue={videoQuality}
            >
              <SelectTrigger id="videoQuality">
                <SelectValue placeholder="Select video quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="360p">360p</SelectItem>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="1080p">1080p</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {format === 'mp3' && (
          <div className="space-y-2">
            <Label htmlFor="audioQuality">Audio Quality</Label>
            <Select
              onValueChange={(value) => setAudioQuality(value as AudioQuality)}
              defaultValue={audioQuality}
            >
              <SelectTrigger id="audioQuality">
                <SelectValue placeholder="Select audio quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="128kbps">128kbps</SelectItem>
                <SelectItem value="192kbps">192kbps</SelectItem>
                <SelectItem value="256kbps">256kbps</SelectItem>
                <SelectItem value="320kbps">320kbps</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {progress.percentage > 0 && (
          <div className="space-y-2">
            <Label htmlFor="progress">Progress</Label>
            <Progress id="progress" value={progress.percentage} />
            <p>{progress.status}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button onClick={handleDownload}>Download</Button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={`download.${format}`}
            ref={downloadLinkRef}
            className="ml-4"
          >
            <Button>Download Now</Button>
          </a>
        )}
      </CardFooter>
    </Card>
  );
}