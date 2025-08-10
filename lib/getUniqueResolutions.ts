export function getUniqueResolutions(videoFormats) {
    if (!Array.isArray(videoFormats)) return [];
  
    // Create a set of quality labels to get unique values
    const qualitySet = new Set();
  
    // Common quality labels we want to prioritize in a specific order
    const commonQualities = [
      "144p",
      "240p",
      "360p",
      "480p",
      "720p",
      "1080p",
      "1440p",
      "2160p",
    ];
  
    // Add available qualities that match common resolutions
    videoFormats.forEach((format) => {
      if (format.qualityLabel && commonQualities.includes(format.qualityLabel)) {
        qualitySet.add(format.qualityLabel);
      }
    });
  
    // Sort by resolution (lowest to highest)
    return commonQualities.filter((quality) => qualitySet.has(quality));
  }