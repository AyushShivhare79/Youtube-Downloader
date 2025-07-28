import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

const Download = async (req: NextRequest, res: NextResponse) => {
  const { url } = await req.json();

  const info = await ytdl.getBasicInfo(url as string);
  console.log("VideoId: ", info.videoDetails.videoId);
  console.log("Thumbnail url: ", info.videoDetails.thumbnails[0].url);
  console.log("Title: ", info.videoDetails.title);
  console.log("Duration: ", info.videoDetails.lengthSeconds, " seconds");

  return NextResponse.json({ message: "Done fetching" });
};

export { Download as GET, Download as POST };
