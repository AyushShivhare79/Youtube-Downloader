'use client';

import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa6';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { SkewLoader } from 'react-spinners';

interface VideoInfo {
  title: string;
  availableQualities: QualityOption[];
  selectedQuality: string;
  audioQuality: string | number;
}

interface QualityOption {
  quality: string;
}

const formSchema = z.object({
  url: z.string().url('Please enter a valid YouTube URL').min(2).max(2000),
  selectedQuality: z.string().optional(),
});

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [url, setUrl] = useState<string>('');
  const [downloadLoad, setDownloadLoad] = useState<string>('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [githubRepo, setGithubRepo] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Set environment variables safely after component mounts
    setGithubRepo(process.env.NEXT_PUBLIC_GITHUB_REPO || 'https://github.com/');

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '/') {
        const isInputFocused = document.activeElement === inputRef.current;

        if (!isInputFocused && inputRef.current) {
          inputRef.current.focus();
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const downloadVideo = async (quality: string) => {
    try {
      setIsLoading(true);
      setDownloadLoad(quality);

      const downloadMessage = `Processing video for ${quality} quality...`;
      toast(downloadMessage);

      const response = await axios.post(
        '/api/download',
        {
          url,
          selectedQuality: quality,
        },
        {
          responseType: 'blob', // Important: This tells Axios to handle the response as a binary blob
        },
      );

      const blob = new Blob([response.data], { type: 'video/mp4' });
      const downloadUrl = window.URL.createObjectURL(blob);
      console.log('Download URL:', downloadUrl);

      const link = document.createElement('a');
      link.href = downloadUrl;

      // Set the filename from the Content-Disposition header if available, otherwise use a default name
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'youtube_video.mp4';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Clean up by removing the link and revoking the blob URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsLoading(false);
      toast('Process completed!');
      setDownloadLoad('');
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setFetchLoading(true);
    setUrl(values.url);
    try {
      const response = await axios.post('/api/download', { url: values.url });
      setVideoInfo(response.data);
      console.log('Video Info:', videoInfo);
      console.log('API Response:', response.data);
    } catch (err) {
      console.error('Error fetching video:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex h-[7dvh] items-center justify-between p-4 px-10">
        <h1 className="text-2xl font-medium">Icon</h1>
        <Link target="_blank" href={githubRepo}>
          <FaGithub size={30} />
        </Link>
      </header>

      <div className="flex flex-grow flex-col items-center">
        <h1 className="w-1/3 text-center text-4xl leading-relaxed">
          Download Your Favorite <span className="font-semibold text-red-500">YouTube Videos</span>{' '}
          Instantly
        </h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mx-auto my-6 flex w-full max-w-2xl items-center justify-center gap-2 p-4"
          >
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex w-full items-center gap-2">
                      <Input
                        className="flex-1 rounded-2xl border border-gray-700 selection:text-blue-500 focus-visible:border-gray-700 focus-visible:ring-0"
                        autoComplete="off"
                        placeholder="Enter YouTube video URL (Press / to focus)"
                        disabled={isLoading}
                        {...field}
                        ref={inputRef}
                      />
                      <Button
                        className={`rounded-2xl whitespace-nowrap ${isLoading ? 'opacity-50' : ''}`}
                        disabled={isLoading}
                        variant={'secondary'}
                        type="submit"
                      >
                        {fetchLoading ? 'Processing...' : 'Start'}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {fetchLoading ? (
          <SkewLoader color="#ffffff" />
        ) : (
          <div>
            {videoInfo && (
              <div className="w-full max-w-3xl px-4">
                <h2 className="mb-6 text-center text-2xl font-semibold">{videoInfo.title}</h2>

                <div className="mb-6 rounded-lg bg-zinc-900 p-6">
                  <h3 className="mb-4 text-xl font-semibold">Available Quality Options</h3>

                  <div className="space-y-3">
                    {videoInfo.availableQualities.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md bg-zinc-800 p-3"
                      >
                        <div>
                          <span className="font-medium">{option.quality}</span>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => downloadVideo(option.quality)}
                          disabled={isLoading}
                          className="text-sm"
                        >
                          {downloadLoad.includes(option.quality) && (
                            <Loader2Icon className="animate-spin" />
                          )}

                          {downloadLoad.includes(option.quality) ? 'Please wait' : 'Download'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="py-4 text-center">Made with ❤️ by humans</footer>
    </div>
  );
}
