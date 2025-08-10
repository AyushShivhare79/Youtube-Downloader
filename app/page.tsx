"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaGithub } from "react-icons/fa6";

interface VideoInfo {
  title: string;
  availableQualities: QualityOption[];
  selectedQuality: string;
  audioQuality: string | number;
}

interface QualityOption {
  quality: string;
  width: number;
  height: number;
  fps: number;
  container: string;
}

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "/") {
        if (inputRef.current) {
          inputRef.current.focus();
          event.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const handleFetch = async () => {
    if (!url.trim()) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/quality", { url });
      setVideoInfo(response.data);
      console.log("Video Info:", videoInfo);
      console.log("API Response:", response.data);
    } catch (err) {
      console.error("Error fetching video:", err);
      setError("Failed to process video. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadVideo = async (quality: string) => {
    try {
      setIsLoading(true);
      // Create a loading message for the user
      const downloadMessage = `Starting download for ${quality} quality...`;
      alert(downloadMessage);
      
      // Make a POST request to the download API endpoint with responseType set to 'blob'
      const response = await axios.post("/api/download", {
        url,
        selectedQuality: quality,
      }, {
        responseType: 'blob' // Important: This tells Axios to handle the response as a binary blob
      });
      
      // Create a blob URL from the response data
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Set the filename from the Content-Disposition header if available, otherwise use a default name
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'youtube_video.mp4';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up by removing the link and revoking the blob URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <header className="h-[7dvh] flex items-center justify-between p-4 px-10">
        <h1 className="text-2xl font-medium">Youtube video downloader</h1>
        <Link target="_blank" href={process.env.NEXT_PUBLIC_GITHUB_REPO!}>
          <FaGithub size={30} />
        </Link>
      </header>

      <div className="flex-grow flex flex-col items-center">
        <div className="flex items-center justify-center gap-2 w-full max-w-2xl mx-auto my-10 p-4">
          <Input
            ref={inputRef}
            className="rounded-2xl"
            autoComplete="off"
            placeholder="Enter YouTube video URL (Press / to focus)"
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleFetch()}
            disabled={isLoading}
          />
          <Button
            className="rounded-2xl"
            variant={"secondary"}
            onClick={handleFetch}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Start"}
          </Button>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {videoInfo && (
          <div className="w-full max-w-3xl px-4">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {videoInfo.title}
            </h2>

            <div className="bg-zinc-900 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Available Quality Options
              </h3>
              <p className="text-zinc-400 mb-4">
                All options include best audio quality:{" "}
                {typeof videoInfo.audioQuality === "number"
                  ? `${videoInfo.audioQuality}kbps`
                  : videoInfo.audioQuality}
              </p>

              <div className="space-y-3">
                {videoInfo.availableQualities.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-md"
                  >
                    <div>
                      <span className="font-medium">{option.quality}</span>
                      <span className="text-sm text-zinc-400 ml-2">
                        ({option.width}x{option.height}, {option.fps}fps)
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => downloadVideo(option.quality)}
                      className="text-sm"
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-4">Made with ❤️ by humans</footer>
    </div>
  );
}
