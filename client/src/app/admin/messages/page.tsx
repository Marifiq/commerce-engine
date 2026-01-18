'use client';

import { useEffect, useState, useCallback } from 'react';
import { Conversation, Message } from '@/types/message';
import { ConversationList } from '@/components/admin/Messaging/ConversationList';
import { ConversationView } from '@/components/admin/Messaging/ConversationView';
import { AddParticipantModal } from '@/components/admin/Messaging/AddParticipantModal';
import {
  getAllConversations,
  getConversation,
  getConversationMessages,
  sendMessage,
  updateConversationStatus,
  addParticipant,
  markMessagesAsRead,
} from '@/services/message.service';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/contexts';
import { useAppSelector } from '@/hooks/useRedux';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'support' | 'internal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed' | 'archived'>('all');
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const { socket, joinConversation, leaveConversation, on, off } = useSocket();
  const { showToast } = useToast();
  const { currentUser } = useAppSelector((state) => state.user);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const data = await getAllConversations(params);
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
  }, [filterType, filterStatus, searchTerm, selectedConversation, showToast]);

  // Load messages for selected conversation
  const loadMessages = useCallback(
    async (conversationId: number) => {
      try {
        setMessagesLoading(true);
        const data = await getConversationMessages(conversationId);
        setMessages(data.messages);

        // Mark messages as read
        try {
          await markMessagesAsRead(conversationId);
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
        await sendMessage(selectedConversation.id, { content, attachments });
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

  // Handle status change
  const handleStatusChange = useCallback(
    async (status: 'open' | 'closed' | 'archived') => {
      if (!selectedConversation) return;

      try {
        await updateConversationStatus(selectedConversation.id, status);
        await loadConversations();
        if (selectedConversation) {
          const updated = await getConversation(selectedConversation.id);
          setSelectedConversation(updated.conversation);
        }
        showToast(`Conversation ${status}`, 'success');
      } catch (error) {
        console.error('Failed to update status:', error);
        showToast('Failed to update conversation status', 'error');
      }
    },
    [selectedConversation, loadConversations, showToast]
  );

  // Handle add participant (for internal conversations)
  const handleAddParticipant = useCallback(() => {
    setShowAddParticipantModal(true);
  }, []);

  const handleAddParticipantConfirm = useCallback(
    async (userId: number) => {
      if (!selectedConversation) return;

      try {
        await addParticipant(selectedConversation.id, userId);
        const updated = await getConversation(selectedConversation.id);
        setSelectedConversation(updated.conversation);
        await loadConversations();
        showToast('Participant added successfully', 'success');
      } catch (error) {
        console.error('Failed to add participant:', error);
        showToast('Failed to add participant', 'error');
        throw error;
      }
    },
    [selectedConversation, loadConversations, showToast]
  );

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { message: Message }) => {
      if (selectedConversation && data.message.conversationId === selectedConversation.id) {
        setMessages((prev) => [...prev, data.message]);
        markMessagesAsRead(selectedConversation.id).catch(console.error);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedConversation) {
        leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation, leaveConversation]);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-zinc-50 dark:bg-black">
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        loading={loading}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
      />
      <ConversationView
        conversation={selectedConversation}
        messages={messages}
        loading={messagesLoading}
        onSendMessage={handleSendMessage}
        onStatusChange={handleStatusChange}
        onAddParticipant={selectedConversation?.type === 'internal' ? handleAddParticipant : undefined}
      />
      
      {selectedConversation && (
        <AddParticipantModal
          isOpen={showAddParticipantModal}
          onClose={() => setShowAddParticipantModal(false)}
          onAdd={handleAddParticipantConfirm}
          excludeUserIds={selectedConversation.participants.map((p) => p.userId)}
        />
      )}
    </div>
  );
}

