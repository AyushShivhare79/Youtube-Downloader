import { NextRequest } from 'next/server';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { getBestAudioTrack } from '@/lib/getBestAudioTrack';
import { getBestVideoForQuality } from '@/lib/getBestVideoForQuality';
import { getUniqueResolutions } from '@/lib/getUniqueResolutions';
import { PassThrough } from 'stream';

// Helper function to convert Node.js streams to Web API ReadableStream
function nodeStreamToWebStream(nodeStream: PassThrough): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      nodeStream.on('end', () => {
        controller.close();
      });
      nodeStream.on('error', (err) => {
        controller.error(err);
      });
    },
  });
}

export async function POST(req: NextRequest) {
  const { url, selectedQuality } = await req.json();

  const info = await ytdl.getInfo(url as string);

  const videoFormats = ytdl.filterFormats(info.formats, 'videoonly');
  const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

  const bestAudio = getBestAudioTrack(audioFormats);

  const availableQualities = getUniqueResolutions(videoFormats);

  const bestVideoOptions = availableQualities
    .map((quality) => {
      return getBestVideoForQuality(videoFormats, quality);
    })
    .filter(Boolean); // Remove any undefined entries

  console.log('Available video qualities:', availableQualities);
  console.log('Best audio track:', bestAudio);

  if (!selectedQuality) {
    console.log(
      'Here we go',
      bestVideoOptions.map((option) => ({
        option,
      })),
    );
    return new Response(
      JSON.stringify({
        title: info.videoDetails.title,
        availableQualities: bestVideoOptions.map((option) => ({
          quality: option?.qualityLabel,
        })),
        audioQuality: bestAudio?.audioBitrate || bestAudio?.bitrate || 'unknown',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const selectedVideo = bestVideoOptions.find((option) => option?.qualityLabel === selectedQuality);

  if (!selectedVideo) {
    return new Response(JSON.stringify({ error: 'Selected quality not available' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const videoStreamURL = selectedVideo?.url;
  const audioStreamURL = bestAudio?.url;

  console.log('Selected video quality:', selectedVideo?.qualityLabel);
  console.log('Video Stream URL:', videoStreamURL);
  console.log('Audio Stream URL:', audioStreamURL);

  if (!videoStreamURL || !audioStreamURL) {
    return new Response(JSON.stringify({ error: 'Missing video or audio stream URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const outputFileName = `${info.videoDetails.title}_${selectedVideo?.qualityLabel}.mp4`;

  console.log(`Merging video (${selectedVideo?.qualityLabel}) and audio to: ${outputFileName}`);

  const outputStream = new PassThrough();

  const command = ffmpeg()
    .input(videoStreamURL)
    .input(audioStreamURL)
    .addOptions([
      '-map 0:v:0', // Map the video stream from the first input
      '-map 1:a:0', // Map the audio stream from the second input
      '-c:v copy', // Copy video without re-encoding
      '-c:a aac', // Re-encode audio to AAC
      '-movflags frag_keyframe+empty_moov', // Essential for streaming MP4
    ])
    .format('mp4')
    .on('error', (err) => {
      console.error('FFmpeg Error:', err);
    });

  command.pipe(outputStream, { end: true });

  // Convert the Node.js PassThrough stream to a Web API ReadableStream
  const webStream = nodeStreamToWebStream(outputStream);

  return new Response(webStream, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(outputFileName)}"`,
      'Transfer-Encoding': 'chunked',
    },
  });
}
