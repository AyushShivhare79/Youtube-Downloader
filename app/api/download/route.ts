import { NextRequest } from "next/server";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  const { url, selectedQuality } = await req.json();

  const info = await ytdl.getInfo(url as string);

  const videoFormats = ytdl.filterFormats(info.formats, "videoonly");
  const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

  // Get the best audio track
  const bestAudio = getBestAudioTrack(audioFormats);

  // Filter out unique resolutions (quality levels)
  const availableQualities = getUniqueResolutions(videoFormats);

  // Get best video format for each quality level
  const bestVideoOptions = availableQualities
    .map((quality) => {
      return getBestVideoForQuality(videoFormats, quality);
    })
    .filter(Boolean); // Remove any undefined entries

  console.log("Available video qualities:", availableQualities);
  console.log("Best audio track:", bestAudio);

  // If a specific quality is requested, use that one
  const qualityToUse = selectedQuality || "720p";

  // Find the requested quality or fall back to the best available
  const selectedVideo =
    bestVideoOptions.find((option) => option.qualityLabel === qualityToUse) ||
    bestVideoOptions[0];

  const videoStreamURL = selectedVideo?.url;
  const audioStreamURL = bestAudio?.url;

  console.log("Selected video quality:", selectedVideo?.qualityLabel);
  console.log("Video Stream URL:", videoStreamURL);
  console.log("Audio Stream URL:", audioStreamURL);

  // Only proceed with merging if we have both video and audio streams
  if (!videoStreamURL || !audioStreamURL) {
    return new Response(JSON.stringify({ error: "Missing video or audio stream URL" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Create a sanitized filename
  const outputFileName = `${info.videoDetails.title.replace(/[^\w\s]/gi, "")}_${
    selectedVideo?.qualityLabel
  }.mp4`;

  console.log(`Merging video (${selectedVideo?.qualityLabel}) and audio to: ${outputFileName}`);

  // Use PassThrough stream which is more suitable for piping
  const { PassThrough } = require('stream');
  const outputStream = new PassThrough();

  // Set up FFmpeg command
  const command = ffmpeg()
    .input(videoStreamURL)
    .input(audioStreamURL)
    .addOptions([
      "-map 0:v:0", // Map the video stream from the first input
      "-map 1:a:0", // Map the audio stream from the second input
      "-c:v copy", // Copy video without re-encoding
      "-c:a aac", // Re-encode audio to AAC
      "-movflags frag_keyframe+empty_moov", // Essential for streaming MP4
    ])
    .format("mp4")
    .on("error", (err) => {
      console.error("FFmpeg Error:", err);
    });

  // Pipe the FFmpeg output to our PassThrough stream
  command.pipe(outputStream, { end: true });
  
  // Return a streaming response
  return new Response(outputStream as any, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(outputFileName)}"`,
      "Transfer-Encoding": "chunked",
    },
  });
}

// For GET requests, we can send info about the video
export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get('url');
  
  if (!url) {
    return new Response(JSON.stringify({ error: "URL is required" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const info = await ytdl.getInfo(url);
    const videoFormats = ytdl.filterFormats(info.formats, "videoonly");
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
    
    // Get the best audio track
    const bestAudio = getBestAudioTrack(audioFormats);
    
    // Filter out unique resolutions
    const availableQualities = getUniqueResolutions(videoFormats);
    
    // Get best video format for each quality level
    const bestVideoOptions = availableQualities
      .map((quality) => getBestVideoForQuality(videoFormats, quality))
      .filter(Boolean);
      
    return new Response(JSON.stringify({
      title: info.videoDetails.title,
      availableQualities: bestVideoOptions.map((option) => ({
        quality: option.qualityLabel,
        width: option.width,
        height: option.height,
        fps: option.fps,
        container: option.container,
      })),
      audioQuality: bestAudio?.audioBitrate || bestAudio?.bitrate || "unknown",
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch video info" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get the best audio track from available formats
 */
function getBestAudioTrack(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;

  // Step 1: Filter only audio-only tracks with decent quality
  const audioOnly = tracks.filter((format) => {
    // Consider both medium and high quality audio
    return (
      (format.audioQuality === "AUDIO_QUALITY_MEDIUM" ||
        format.audioQuality === "AUDIO_QUALITY_HIGH") &&
      // Some formats might not have audioTrack property
      (!format.audioTrack || format.audioTrack.audioIsDefault !== false)
    );
  });

  if (audioOnly.length === 0) return tracks[0]; // Return any audio if filtering returns nothing

  // Step 2: Prefer Opus codec
  const opusTracks = audioOnly.filter(
    (t) =>
      (t.audioCodec && t.audioCodec.includes("opus")) ||
      (t.codecs && t.codecs.includes("opus"))
  );

  const candidates = opusTracks.length > 0 ? opusTracks : audioOnly;

  // Step 3: Sort by audioBitrate, sampleRate, audioChannels
  const sorted = [...candidates].sort((a, b) => {
    const getBitrate = (t) => parseInt(t.audioBitrate || t.bitrate || 0);
    const getSampleRate = (t) => parseInt(t.audioSampleRate || 0);
    const getChannels = (t) => parseInt(t.audioChannels || 0);

    // Sort priority: bitrate > sample rate > channels
    return (
      getBitrate(b) - getBitrate(a) ||
      getSampleRate(b) - getSampleRate(a) ||
      getChannels(b) - getChannels(a)
    );
  });

  return sorted[0]; // Best audio track
}

/**
 * Get a list of unique available resolutions from video formats
 */
function getUniqueResolutions(videoFormats) {
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

/**
 * Get the best video format for a specific quality
 */
function getBestVideoForQuality(videoFormats, qualityLabel) {
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
