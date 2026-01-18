'use client';

import { useEffect, useRef, useState } from 'react';
import { Conversation, Message } from '@/types/message';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { ConversationHeader } from './ConversationHeader';
import { useAppSelector } from '@/hooks/useRedux';
import { LoadingSpinner } from '@/components/ui';

interface ConversationViewProps {
  conversation: Conversation | null;
  messages: Message[];
  loading?: boolean;
  onSendMessage: (content: string, attachments: File[]) => Promise<void>;
  onStatusChange?: (status: 'open' | 'closed' | 'archived') => Promise<void>;
  onAddParticipant?: () => void;
}

export function ConversationView({
  conversation,
  messages,
  loading = false,
  onSendMessage,
  onStatusChange,
  onAddParticipant,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAppSelector((state) => state.user);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-black text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Select a conversation</p>
          <p className="text-sm">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  const handleSend = async (content: string, attachments: File[]) => {
    setSending(true);
    try {
      await onSendMessage(content, attachments);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 h-full">
      <ConversationHeader
        conversation={conversation}
        onStatusChange={onStatusChange}
        onAddParticipant={onAddParticipant}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="medium" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === currentUser?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {conversation.status !== 'closed' && conversation.status !== 'archived' && (
        <MessageInput onSend={handleSend} disabled={sending} />
      )}
    </div>
  );
}

