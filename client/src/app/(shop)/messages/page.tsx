'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Conversation, Message } from '@/types/message';
import { ConversationList } from '@/components/admin/Messaging/ConversationList';
import { ConversationView } from '@/components/admin/Messaging/ConversationView';
import {
  getCustomerConversations,
  getCustomerConversation,
  getCustomerConversationMessages,
  sendCustomerMessage,
  markCustomerMessagesAsRead,
  createSupportConversation,
} from '@/services/message.service';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/contexts';
import { useAppSelector } from '@/hooks/useRedux';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { socket, joinConversation, leaveConversation, on, off } = useSocket();
  const { showToast } = useToast();
  const { currentUser } = useAppSelector((state) => state.user);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomerConversations();
      setConversations(data.conversations);

      // If a conversation was selected and it's no longer in the list, clear selection
      if (selectedConversation) {
        const stillExists = data.conversations.some((c) => c.id === selectedConversation.id);
        if (!stillExists) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      showToast('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, showToast]);

  // Load messages for selected conversation
  const loadMessages = useCallback(
    async (conversationId: number) => {
      try {
        setMessagesLoading(true);
        const data = await getCustomerConversationMessages(conversationId);
        setMessages(data.messages);

        // Mark messages as read
        try {
          await markCustomerMessagesAsRead(conversationId);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        showToast('Failed to load messages', 'error');
      } finally {
        setMessagesLoading(false);
      }
    },
    [showToast]
  );

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    async (conversation: Conversation) => {
      // Leave previous conversation room
      if (selectedConversation) {
        leaveConversation(selectedConversation.id);
      }

      setSelectedConversation(conversation);
      await loadMessages(conversation.id);

      // Join new conversation room
      joinConversation(conversation.id);
    },
    [selectedConversation, joinConversation, leaveConversation, loadMessages]
  );

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string, attachments: File[]) => {
      if (!selectedConversation) return;

      try {
        await sendCustomerMessage(selectedConversation.id, { content, attachments });
        await loadMessages(selectedConversation.id);
        await loadConversations();
      } catch (error) {
        console.error('Failed to send message:', error);
        showToast('Failed to send message', 'error');
        throw error;
      }
    },
    [selectedConversation, loadMessages, loadConversations, showToast]
  );

  // Handle creating new conversation
  const handleNewConversation = useCallback(async () => {
    try {
      const response = await createSupportConversation('New Support Request');
      await loadConversations();
      if (response.conversation) {
        await handleSelectConversation(response.conversation);
      }
      showToast('Conversation created', 'success');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      showToast('Failed to create conversation', 'error');
    }
  }, [loadConversations, handleSelectConversation, showToast]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { message: Message }) => {
      if (selectedConversation && data.message.conversationId === selectedConversation.id) {
        setMessages((prev) => [...prev, data.message]);
        markCustomerMessagesAsRead(selectedConversation.id).catch(console.error);
      }
      loadConversations();
    };

    const handleConversationUpdated = (data: { conversation: Conversation }) => {
      if (selectedConversation && data.conversation.id === selectedConversation.id) {
        setSelectedConversation(data.conversation);
      }
      loadConversations();
    };

    on('new-message', handleNewMessage);
    on('conversation-updated', handleConversationUpdated);

    return () => {
      off('new-message', handleNewMessage);
      off('conversation-updated', handleConversationUpdated);
    };
  }, [socket, selectedConversation, on, off, loadConversations]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle conversation query parameter
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0 && !selectedConversation) {
      const conversation = conversations.find((c) => c.id === parseInt(conversationId));
      if (conversation) {
        handleSelectConversation(conversation);
      } else {
        // Try to load the conversation directly
        getCustomerConversation(parseInt(conversationId))
          .then((data) => {
            if (data.conversation) {
              handleSelectConversation(data.conversation);
            }
          })
          .catch(console.error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedConversation) {
        leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation, leaveConversation]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(searchLower) ||
      conv.participants.some((p) => 
        p.user.name.toLowerCase().includes(searchLower) ||
        p.user.email.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
            Messages
          </h1>
          <p className="text-zinc-400">Chat with support and other users</p>
        </div>

        <div className="h-[calc(100vh-200px)] flex bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="w-full md:w-80 border-r border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Conversations</h2>
              <button
                onClick={handleNewConversation}
                className="px-4 py-2 bg-white text-black rounded-lg hover:opacity-90 transition-all font-medium text-sm"
              >
                New Chat
              </button>
            </div>
            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversation?.id || null}
              onSelectConversation={handleSelectConversation}
              onSearch={setSearchTerm}
              searchTerm={searchTerm}
              loading={loading}
            />
          </div>
          <ConversationView
            conversation={selectedConversation}
            messages={messages}
            loading={messagesLoading}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}

