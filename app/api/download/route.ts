import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

const Download = async (req: NextRequest, res: NextResponse) => {
  const { url } = await req.json();
  console.log("URL: ", url);
  const info = await ytdl.getInfo(url as string);

  const videoFormats = ytdl.filterFormats(info.formats, "audioandvideo");
  console.log("Formats: ", videoFormats);

  const format = ytdl.chooseFormat(videoFormats, {
    quality: "highest",
  });

  // console.log("Chosen format: ", format);

  // console.log("VideoId: ", info.videoDetails.videoId);
  // console.log("Thumbnail url: ", info.videoDetails.thumbnails[0].url);
  // console.log("Title: ", info.videoDetails.title);
  // console.log("Duration: ", info.videoDetails.lengthSeconds, " seconds");

  return NextResponse.json({
    videoFormats,
    format,
  });
};
export { Download as GET, Download as POST };
