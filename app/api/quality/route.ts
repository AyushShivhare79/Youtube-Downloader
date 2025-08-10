import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const POST = async (req: NextRequest) => {
  const { url } = await req.json();

  const info = await ytdl.getInfo(url as string);

  const videoFormats = ytdl.filterFormats(info.formats, "videoonly");
  console.log("Video Formats:", videoFormats);
  const availableQualities = getUniqueResolutions(videoFormats);

  //   return NextResponse.json({ availableQualities });

  return NextResponse.json({
    title: info.videoDetails.title,
    availableQualities: availableQualities.map((quality) => ({
      quality: quality,
    })),
  });
};

function getUniqueResolutions(videoFormats: any) {
  if (!Array.isArray(videoFormats)) return [];

  const qualitySet = new Set();

  const commonQualities = ["144p", "240p", "360p", "480p", "720p"];

  videoFormats.forEach((format) => {
    if (format.qualityLabel && commonQualities.includes(format.qualityLabel)) {
      qualitySet.add(format.qualityLabel);
    }
  });

  return commonQualities.filter((quality) => qualitySet.has(quality));
}
