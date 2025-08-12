"use client";

import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaGithub } from "react-icons/fa6";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

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

const formSchema = z.object({
  url: z.string().url("Please enter a valid YouTube URL").min(2).max(2000),
  selectedQuality: z.string().optional(),
});

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadLoad, setDownloadLoad] = useState<string>("");

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

  const downloadVideo = async (quality: string) => {
    try {
      setIsLoading(true);
      setDownloadLoad(quality);

      const downloadMessage = `Processing video for ${quality} quality...`;
      toast(downloadMessage);

      const response = await axios.post(
        "/api/download",
        {
          url,
          selectedQuality: quality,
        },
        {
          responseType: "blob", // Important: This tells Axios to handle the response as a binary blob
        }
      );

      const blob = new Blob([response.data], { type: "video/mp4" });
      const downloadUrl = window.URL.createObjectURL(blob);
      console.log("Download URL:", downloadUrl);

      const link = document.createElement("a");
      link.href = downloadUrl;

      // Set the filename from the Content-Disposition header if available, otherwise use a default name
      const contentDisposition = response.headers["content-disposition"];
      let filename = "youtube_video.mp4";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up by removing the link and revoking the blob URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsLoading(false);
      toast("Process completed!");
      setDownloadLoad("");
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setUrl(values.url);
    try {
      const response = await axios.post("/api/download", { url: values.url });
      setVideoInfo(response.data);
      console.log("Video Info:", videoInfo);
      console.log("API Response:", response.data);
    } catch (err) {
      console.error("Error fetching video:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <header className="h-[7dvh] flex items-center justify-between p-4 px-10">
        <h1 className="text-2xl font-medium">Icon</h1>
        <Link target="_blank" href={process.env.NEXT_PUBLIC_GITHUB_REPO!}>
          <FaGithub size={30} />
        </Link>
      </header>

      <div className="flex-grow flex flex-col items-center">
        <h1 className="text-4xl w-1/3 leading-relaxed text-center">
          Download Your Favorite{" "}
          <span className="text-red-500 font-semibold">YouTube Videos</span>{" "}
          Instantly
        </h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-center justify-center gap-2 w-full max-w-2xl mx-auto my-6 p-4 "
          >
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        className="rounded-2xl border border-gray-700 focus-visible:border-gray-700  selection:text-blue-500  focus-visible:ring-0 flex-1"
                        autoComplete="off"
                        placeholder="Enter YouTube video URL (Press / to focus)"
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        className={`rounded-2xl whitespace-nowrap ${
                          isLoading ? "opacity-50" : ""
                        }`}
                        disabled={isLoading}
                        variant={"secondary"}
                        type="submit"
                      >
                        {isLoading ? "Processing..." : "Start"}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {videoInfo && (
          <div className="w-full max-w-3xl px-4">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              {videoInfo.title}
            </h2>

            <div className="bg-zinc-900 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Available Quality Options
              </h3>

              <div className="space-y-3">
                {videoInfo.availableQualities.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-md"
                  >
                    <div>
                      <span className="font-medium">{option.quality}</span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => downloadVideo(option.quality)}
                      disabled={isLoading}
                      className="text-sm"
                    >
                      {downloadLoad.includes(option.quality) && (
                        <Loader2Icon className="animate-spin" />
                      )}

                      {/* {isLoading ? "Please wait" : "Download"} */}
                      {downloadLoad.includes(option.quality)
                        ? "Please wait"
                        : "Download"}
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
