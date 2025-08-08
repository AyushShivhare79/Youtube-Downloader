"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaGithub } from "react-icons/fa6";

interface VideoInfo {
  videoDetails: {
    title: string;
    lengthSeconds: number;
    thumbnails: { url: string }[];
  };
}
interface VideoFormat {
  qualityLabel: string;
  hasVideo: boolean;
  hasAudio: boolean;
  url: string;
}

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [videoFormats, setVideoFormats] = useState<VideoFormat[]>([]);
  const [videoInfo, setVideoInfo] = useState<VideoInfo>();

  const inputRef = useRef<HTMLInputElement>(null);
  console.log("Video Formats:", videoFormats);

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
    const response = await axios.post("/api/download", { url });
    setVideoFormats(response.data.videoFormats);
    setVideoInfo(response.data.info);
  };

  return (
    <div className="bg-black text-white ">
      <header className="h-[7dvh] flex items-center justify-between p-4 px-10">
        <h1 className="text-2xl font-medium">Youtube video downloader</h1>
        <Link target="_blank" href={process.env.NEXT_PUBLIC_GITHUB_REPO!}>
          <FaGithub size={30} />
        </Link>
      </header>
      <div className="h-[90dvh] ">
        <div className=" flex items-center justify-center gap-2 w-2/4 mx-auto my-10 p-4">
          <Input
            ref={inputRef}
            className="rounded-2xl"
            autoComplete="off"
            placeholder="Enter YouTube video URL"
            onChange={(e) => setUrl(e.target.value)}
          />

          <Button
            className="rounded-2xl"
            variant={"secondary"}
            onClick={handleFetch}
          >
            Start
          </Button>
        </div>

        <section>
          {videoInfo && (
            <div className="flex gap-10 justify-center items-center ">
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

          {videoFormats.length > 0 && (
            <div className="flex space-y-2 my-2 flex-col items-center gap-2">
              <h1>Video</h1>
              {videoFormats
                // .filter((format) => format.hasVideo)
                .map((format, index) => (
                  <div key={index} className=" p-2 rounded-lg w-2/4">
                    <div className="flex justify-between px-20 items-center gap-2">
                      <p> {format.qualityLabel}.mp4</p>
                      <Button variant={"secondary"} asChild>
                        <Link target="_blank" href={format.url}>
                          Download
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}

              <h1>Audio</h1>
              <div></div>
            </div>
          )}
        </section>
      </div>
      <footer className="text-center h-[3dvh] ">Made with ❤️ by humans</footer>
    </div>
  );
}
