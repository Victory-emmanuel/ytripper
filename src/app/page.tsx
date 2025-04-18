"use client";

import { useState } from "react";
import { DownloadFormat, VideoQuality, AudioQuality, DownloadProgress } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/icons";

export default function YTubeRipper() {
  const [youtubeURL, setYoutubeURL] = useState("");
  const [format, setFormat] = useState<DownloadFormat>("mp3");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("720p");
  const [audioQuality, setAudioQuality] = useState<AudioQuality | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadProgress(0);
    setDownloadURL(null);

    const progressCallback = (progress: DownloadProgress) => {
      setDownloadProgress(progress.percentage);
    };

    try {
      const response = await fetch("/api/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: youtubeURL,
          format: format,
          videoQuality: videoQuality,
          audioQuality: audioQuality,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadURL(url);      
    } catch (error:any) {
      console.error("Download failed:", error);
      setDownloadError(error.message || "An error occurred during download.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isMP4 = format === "mp4";
  const isMP3 = format === "mp3";

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4 text-center">YTubeRipper</h1>
      <div className="mb-4">
        <Label htmlFor="youtube-url">YouTube URL</Label>
        <Input
          type="url"
          id="youtube-url"
          placeholder="Enter YouTube URL"
          value={youtubeURL}
          onChange={(e) => setYoutubeURL(e.target.value)}
          disabled={isDownloading}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="format">Format</Label>
        <Select value={format} onValueChange={(value) => setFormat(value as DownloadFormat)}>
          <SelectTrigger>
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp3">MP3</SelectItem>
            <SelectItem value="mp4">MP4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isMP4 && (
        <div className="mb-4">
          <Label htmlFor="video-quality">Video Quality</Label>
          <Select value={videoQuality} onValueChange={(value) => setVideoQuality(value as VideoQuality)}>
            <SelectTrigger>
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

      {isMP3 && (
        <div className="mb-4">
          <Label htmlFor="audio-quality">Audio Quality</Label>
          <Select value={audioQuality} onValueChange={(value) => setAudioQuality(value as AudioQuality)}>
            <SelectTrigger>
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

      <Button onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Downloading...
          </>
        ) : (
          "Download"
        )}
      </Button>

      {downloadProgress > 0 && (
        <div className="mt-4">
          <Progress value={downloadProgress} />
        </div>
      )}

      {downloadURL && (
        <div className="mt-4">
          <Alert>
            <AlertDescription>
              Download ready:{" "}
              <a
                href={downloadURL}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {downloadURL}
              </a>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {downloadError && (
        <div className="mt-4">
          <Alert variant="destructive">
            <AlertDescription>{downloadError}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
