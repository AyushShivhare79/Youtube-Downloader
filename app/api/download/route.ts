import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

const Download = async (req: NextRequest, res: NextResponse) => {
  const { url } = await req.json();

  const info = await ytdl.getInfo(url as string);

  const videoFormats = ytdl.filterFormats(info.formats, "videoandaudio");

  return NextResponse.json({
    info,
    videoFormats,
  });
};

export { Download as GET, Download as POST };
