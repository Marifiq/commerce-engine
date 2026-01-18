'use client';

import { Message } from '@/types/message';
import Image from 'next/image';
import { Download, File, Video, Image as ImageIcon } from 'lucide-react';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { formatDistanceToNow } from 'date-fns';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex gap-3 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {!isOwnMessage && (
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
              {message.sender.profileImage ? (
                <Image
                  src={resolveImageUrl(message.sender.profileImage)}
                  alt={message.sender.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                  {message.sender.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        )}

        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              {message.sender.name}
            </div>
          )}

          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwnMessage
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {message.content && (
              <div className="text-sm whitespace-pre-wrap break-words mb-2">
                {message.content}
              </div>
            )}

            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-2">
                {message.attachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    {attachment.type === 'image' && (
                      <div className="rounded-lg overflow-hidden max-w-sm">
                        <Image
                          src={resolveImageUrl(attachment.url)}
                          alt={attachment.filename}
                          width={400}
                          height={400}
                          className="object-cover w-full h-auto"
                        />
                      </div>
                    )}

                    {attachment.type === 'video' && (
                      <div className="rounded-lg overflow-hidden max-w-sm">
                        <video
                          src={resolveImageUrl(attachment.url)}
                          controls
                          className="max-w-full max-h-96"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {(attachment.type === 'document' || attachment.type === 'video') && (
                      <a
                        href={resolveImageUrl(attachment.url)}
                        download={attachment.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        {attachment.type === 'video' ? (
                          <Video size={16} />
                        ) : (
                          <File size={16} />
                        )}
                        <span className="text-xs font-medium truncate max-w-xs">
                          {attachment.filename}
                        </span>
                        <Download size={14} className="flex-shrink-0" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

