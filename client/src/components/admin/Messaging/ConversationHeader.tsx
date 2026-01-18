'use client';

import { Conversation } from '@/types/message';
import { MoreVertical, Archive, X, UserPlus } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils/imageUtils';

interface ConversationHeaderProps {
  conversation: Conversation;
  onStatusChange?: (status: 'open' | 'closed' | 'archived') => void;
  onAddParticipant?: () => void;
}

export function ConversationHeader({
  conversation,
  onStatusChange,
  onAddParticipant,
}: ConversationHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  const otherParticipants = conversation.participants.filter(
    (p) => p.user.role !== 'admin' || conversation.type === 'internal'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      case 'archived':
        return 'bg-zinc-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {conversation.type === 'internal' && otherParticipants.length > 0 ? (
            <div className="flex -space-x-2">
              {otherParticipants.slice(0, 3).map((participant) => (
                <div
                  key={participant.id}
                  className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-900"
                >
                  {participant.user.profileImage ? (
                    <Image
                      src={resolveImageUrl(participant.user.profileImage)}
                      alt={participant.user.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                      {participant.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            otherParticipants.length > 0 && (
              <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {otherParticipants[0].user.profileImage ? (
                  <Image
                    src={resolveImageUrl(otherParticipants[0].user.profileImage)}
                    alt={otherParticipants[0].user.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                    {otherParticipants[0].user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {conversation.title ||
                  otherParticipants.map((p) => p.user.name).join(', ') ||
                  'Untitled Conversation'}
              </h2>
              <div className={`h-2 w-2 rounded-full ${getStatusColor(conversation.status)}`} />
            </div>
            {conversation.type === 'support' && otherParticipants.length > 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                {otherParticipants[0].user.email}
              </p>
            )}
          </div>
        </div>

        {onStatusChange && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <MoreVertical size={20} className="text-zinc-600 dark:text-zinc-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-20">
                {conversation.type === 'internal' && onAddParticipant && (
                  <button
                    onClick={() => {
                      onAddParticipant();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Add Participant
                  </button>
                )}
                {onStatusChange && conversation.status !== 'closed' && (
                  <button
                    onClick={() => {
                      onStatusChange('closed');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <X size={16} />
                    Close
                  </button>
                )}
                {onStatusChange && conversation.status !== 'archived' && (
                  <button
                    onClick={() => {
                      onStatusChange('archived');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Archive size={16} />
                    Archive
                  </button>
                )}
                {onStatusChange && conversation.status === 'closed' && (
                  <button
                    onClick={() => {
                      onStatusChange('open');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

