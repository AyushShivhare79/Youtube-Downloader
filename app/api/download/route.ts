import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";
import { format } from "path";
import ffmpeg from "fluent-ffmpeg";

const Download = async (req: NextRequest, res: NextResponse) => {
  const { url } = await req.json();

  const info = await ytdl.getInfo(url as string);

  const videoFormats = ytdl.filterFormats(info.formats, "videoonly");
  const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

  console.log(
    "Video Formats:",
    // Filter quality label 720p
    videoFormats
      .filter((format) => format.qualityLabel === "720p")
      .map((format) => ({
        qualityLabel: format.qualityLabel,
        hasVideo: format.hasVideo,
        url: format.url,
      }))
  );

  const videoStreamURL = videoFormats.filter(
    (format) => format.qualityLabel === "720p"
  )[0].url;
  const audioStreamURL = audioFormats[0].url;

  console.log("Video Stream URL:", videoStreamURL);
  console.log("Audio Stream URL:", audioStreamURL);

  ffmpeg()
    .input(videoStreamURL) // Use the video stream URL from ytdl
    .input(audioStreamURL) // Use the audio stream URL from ytdl
    .addOptions([
      "-map 0:v:0", // Map the video stream from the first input (index 0)
      "-map 1:a:0", // Map the audio stream from the second input (index 1)
      "-c:v copy", // Copy the video stream without re-encoding
      "-c:a copy", // Re-encode audio to AAC if necessary, or use 'copy' if compatible
    ])
    .output("merged_video.mp4")
    .on("end", () => {
      console.log("Merging complete!");
    })
    .on("error", (err) => {
      console.error("Error merging streams:", err);
    })
    .run();

  return NextResponse.json({
    info,
    videoFormats,
    audioFormats,
  });
};

export { Download as GET, Download as POST };
