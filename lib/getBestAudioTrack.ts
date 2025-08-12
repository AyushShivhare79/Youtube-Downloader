import ytdl from "@distube/ytdl-core";

export function getBestAudioTrack(tracks: ytdl.videoFormat[]) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;

  // Step 1: Filter only audio-only tracks with decent quality
  const audioOnly = tracks.filter((format) => {
    // Consider both medium and high quality audio
    return (
      format.audioQuality === "AUDIO_QUALITY_MEDIUM"
      // &&
      // Some formats might not have audioTrack property
      // (!format.audioTrack || format.audioTrack.audioIsDefault !== false)
    );
  });

  if (audioOnly.length === 0) {
    console.log("No suitable audio tracks found, returning first track");
    return tracks[0];
  }

  // Step 2: Prefer Opus codec
  const opusTracks = audioOnly.filter(
    (t) =>
      (t.audioCodec && t.audioCodec.includes("opus")) ||
      (t.codecs && t.codecs.includes("opus"))
  );

  console.log("Opus tracks found:", opusTracks.length);
  console.log("Audio-only tracks found:", audioOnly.length);

  const candidates = opusTracks.length > 0 ? opusTracks : audioOnly;

  // Step 3: Sort by audioBitrate, sampleRate, audioChannels
  const sorted = [...candidates].sort((a, b) => {
    const getBitrate = (t: ytdl.videoFormat) =>
      Number(t.audioBitrate || t.bitrate || 0);
    const getSampleRate = (t: ytdl.videoFormat) =>
      Number(t.audioSampleRate || 0);
    const getChannels = (t: ytdl.videoFormat) => Number(t.audioChannels || 0);

    // Sort priority: bitrate > sample rate > channels
    return (
      getBitrate(b) - getBitrate(a) ||
      getSampleRate(b) - getSampleRate(a) ||
      getChannels(b) - getChannels(a)
    );
  });

  return sorted[0]; // Best audio track
}
