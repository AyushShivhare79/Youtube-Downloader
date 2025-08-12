import ytdl from "@distube/ytdl-core";

export function getBestVideoForQuality(
  videoFormats: ytdl.videoFormat[],
  qualityLabel: string
) {
  if (!Array.isArray(videoFormats)) return null;

  // Filter formats by quality label
  const matchingFormats = videoFormats.filter(
    (format) => format.qualityLabel === qualityLabel
  );

  if (matchingFormats.length === 0) return null;

  // Sort by FPS and then by bitrate (prefer higher)
  const sorted = [...matchingFormats].sort((a, b) => {
    const aFps = a.fps || 0;
    const bFps = b.fps || 0;
    const aBitrate = Number(a.bitrate || 0);
    const bBitrate = Number(b.bitrate || 0);

    // First by FPS, then by bitrate
    return bFps - aFps || bBitrate - aBitrate;
  });


  return sorted[0]; // Return the best format for this quality
}
