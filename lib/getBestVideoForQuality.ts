export function getBestVideoForQuality(videoFormats, qualityLabel) {
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
    const aBitrate = parseInt(a.bitrate || 0);
    const bBitrate = parseInt(b.bitrate || 0);

    // First by FPS, then by bitrate
    return bFps - aFps || bBitrate - aBitrate;
  });

  return sorted[0]; // Return the best format for this quality
}
