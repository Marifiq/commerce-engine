'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, MessageCircle, Minimize2 } from 'lucide-react';
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

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const { socket, joinConversation, leaveConversation, on, off } = useSocket();
  const { showToast } = useToast();
  const { currentUser, isAuthenticated } = useAppSelector((state) => state.user);

  // Ensure component only renders after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render if user is not authenticated or component hasn't mounted yet
  if (!mounted || !isAuthenticated) {
    return null;
  }

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
    if (!socket || !isOpen) return;

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
  }, [socket, selectedConversation, on, off, loadConversations, isOpen]);

  // Load conversations when widget opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      loadConversations();
    }
  }, [isOpen, isMinimized, loadConversations]);

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

  const handleToggleOpen = () => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    if (selectedConversation) {
      leaveConversation(selectedConversation.id);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleToggleOpen}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-black hover:bg-zinc-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110"
          title="Customer Support"
          aria-label="Open customer support chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all duration-300 ${
            isMinimized ? 'h-16 w-80' : 'h-[600px] w-[400px] md:w-[500px]'
          } flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-black dark:bg-zinc-900 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-white" size={20} />
              <h2 className="text-lg font-bold text-white">Customer Support</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleOpen}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                title="Minimize"
                aria-label="Minimize chat"
              >
                <Minimize2 size={18} />
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                title="Close"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Conversations</h3>
                  <button
                    onClick={handleNewConversation}
                    className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-all font-medium text-xs"
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
          )}
        </div>
      )}
    </>
  );
}

