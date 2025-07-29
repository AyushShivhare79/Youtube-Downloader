"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaGithub } from "react-icons/fa6";
import axios from "axios";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleDownload = async () => {
    const response = await axios.post("/api/download", { url });
    console.log("Response: ", response.data);
    setVideoUrl(response.data.format.url);
  };

  return (
    <div className="bg-black text-white ">
      <header className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-medium">Youtube video downloader</h1>
        <FaGithub size={30} />
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
        {/* {videoUrl && <video controls src={videoUrl}></video>} */}

        <footer className="text-center border">Made with ❤️ by humans</footer>
      </div>
    </div>
  );
}
