"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaGithub } from "react-icons/fa6";
import axios from "axios";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoFormats, setVideoFormats] = useState([]);
  const [videoInfo, setVideoInfo] = useState(null);

  const handleDownload = async () => {
    const response = await axios.post("/api/download", { url });
    console.log("Response: ", response.data);
    setVideoFormats(response.data.videoFormats);
    setVideoInfo(response.data.info);
  };

  return (
    <div className="bg-black text-white ">
      <header className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-medium">Youtube video downloader</h1>
        <Link target="_blank" href={process.env.NEXT_PUBLIC_GITHUB_REPO!}>
          <FaGithub size={30} />
        </Link>
      </header>

      <div className="h-dvh border">
        <div className="flex items-center justify-center gap-2 w-2/4 border mx-auto my-10 p-4">
          <Input
            className="rounded-2xl"
            autoComplete="off"
            placeholder="Enter YouTube video URL"
            onChange={(e) => setUrl(e.target.value)}
          />

          <Button
            className="rounded-2xl"
            variant={"secondary"}
            onClick={handleDownload}
          >
            Start
          </Button>
        </div>
        {/* Title and duration and thumbnail */}
        {videoInfo && (
          <div className="flex justify-center items-center border border-white">
            <Image
              height={300}
              width={300}
              className="rounded-lg"
              src={videoInfo.videoDetails.thumbnails[0].url}
              alt="Thumbnail"
            />
            <div className="text-xl">
              <h1>{videoInfo.videoDetails.title}</h1>
              <h1>
                Duration:{" "}
                {videoInfo.videoDetails.lengthSeconds > 60
                  ? (videoInfo.videoDetails.lengthSeconds / 60).toFixed(1) +
                    " minutes"
                  : videoInfo.videoDetails.lengthSeconds + " seconds"}
              </h1>
            </div>
          </div>
        )}
        {videoFormats && (
          <div className="flex flex-col items-center gap-2">
            {videoFormats
              .filter((format) => format.hasVideo && format.hasAudio)
              .map((format, index) => (
                <div key={index} className="border p-2 rounded-lg w-2/4">
                  <div className="flex items-center gap-2">
                    <p> {format.qualityLabel}.mp4</p>
                    <Button asChild>
                      <Link target="_blank" href={format.url}>
                        Download
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        <footer className="text-center border">Made with ❤️ by humans</footer>
      </div>
    </div>
  );
}
