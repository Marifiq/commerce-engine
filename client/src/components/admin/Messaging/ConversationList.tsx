'use client';

import { Conversation } from '@/types/message';
import { Search, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { formatDistanceToNow } from 'date-fns';
import { useAppSelector } from '@/hooks/useRedux';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (conversation: Conversation) => void;
  onSearch: (search: string) => void;
  searchTerm: string;
  loading?: boolean;
  filterType?: 'all' | 'support' | 'internal';
  onFilterTypeChange?: (type: 'all' | 'support' | 'internal') => void;
  filterStatus?: 'all' | 'open' | 'closed' | 'archived';
  onFilterStatusChange?: (status: 'all' | 'open' | 'closed' | 'archived') => void;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onSearch,
  searchTerm,
  loading = false,
  filterType = 'all',
  onFilterTypeChange,
  filterStatus = 'all',
  onFilterStatusChange,
}: ConversationListProps) {
  const { currentUser } = useAppSelector((state) => state.user);
  const getOtherParticipants = (conversation: Conversation) => {
    return conversation.participants.filter(
      (p) => p.user.role !== 'admin' || conversation.type === 'internal'
    );
  };

  const getLastMessage = (conversation: Conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[0];
    }
    return null;
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>
        
        {(onFilterTypeChange || onFilterStatusChange) && (
          <div className="flex gap-2">
            {onFilterTypeChange && (
              <select
                value={filterType}
                onChange={(e) => onFilterTypeChange(e.target.value as 'all' | 'support' | 'internal')}
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-zinc-900 dark:text-zinc-100 text-sm"
              >
                <option value="all">All Types</option>
                <option value="support">Support</option>
                <option value="internal">Internal</option>
              </select>
            )}
            {onFilterStatusChange && (
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value as 'all' | 'open' | 'closed' | 'archived')}
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-zinc-900 dark:text-zinc-100 text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
            No conversations found
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherParticipants = getOtherParticipants(conversation);
            const lastMessage = getLastMessage(conversation);
            const isSelected = conversation.id === selectedConversationId;
            // Check if current user has unread messages in this conversation
            const currentUserParticipant = conversation.participants.find(
              (p) => p.userId === currentUser?.id
            );
            const hasUnread = currentUserParticipant ? !currentUserParticipant.isRead : false;

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full p-4 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left ${
                  isSelected ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {conversation.type === 'internal' && otherParticipants.length > 0 ? (
                    <div className="flex -space-x-2 flex-shrink-0">
                      {otherParticipants.slice(0, 2).map((participant) => (
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
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                              {participant.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    otherParticipants.length > 0 && (
                      <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {conversation.title ||
                          otherParticipants.map((p) => p.user.name).join(', ') ||
                          'Untitled Conversation'}
                      </h3>
                      {conversation.lastMessageAt && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0 ml-2">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                        {lastMessage.sender.name}: {lastMessage.content || 'Attachment'}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          conversation.status === 'open'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : conversation.status === 'closed'
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {conversation.status}
                      </span>
                      {hasUnread && (
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

