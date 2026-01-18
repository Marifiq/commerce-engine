import { apiFetch } from "@/lib/utils/api";
import {
  Conversation,
  ConversationListResponse,
  CreateConversationData,
  Message,
  MessageListResponse,
  SendMessageData,
} from "@/types/message";

// Admin endpoints
export const getAllConversations = async (params?: {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ConversationListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append("type", params.type);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const query = queryParams.toString();
  const res = await apiFetch(`/admin/messages/conversations${query ? `?${query}` : ""}`);
  return res.data;
};

export const getConversation = async (id: number): Promise<{ conversation: Conversation }> => {
  const res = await apiFetch(`/admin/messages/conversations/${id}`);
  return res.data;
};

export const createConversation = async (
  data: CreateConversationData
): Promise<{ conversation: Conversation }> => {
  const res = await apiFetch("/admin/messages/conversations", {
    method: "POST",
    body: data,
  });
  return res.data;
};

export const getConversationMessages = async (
  conversationId: number,
  page: number = 1,
  limit: number = 50
): Promise<MessageListResponse> => {
  const res = await apiFetch(
    `/admin/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
  );
  return res.data;
};

export const sendMessage = async (
  conversationId: number,
  data: SendMessageData
): Promise<{ message: Message }> => {
  const formData = new FormData();
  formData.append("content", data.content || "");

  if (data.attachments && data.attachments.length > 0) {
    data.attachments.forEach((file) => {
      formData.append("attachments", file);
    });
  }

  const res = await apiFetch(`/admin/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: formData,
  });
  return res.data;
};

export const markMessagesAsRead = async (conversationId: number): Promise<void> => {
  await apiFetch(`/admin/messages/conversations/${conversationId}/messages/read`, {
    method: "POST",
  });
};

export const updateConversationStatus = async (
  conversationId: number,
  status: "open" | "closed" | "archived"
): Promise<{ conversation: Conversation }> => {
  const res = await apiFetch(`/admin/messages/conversations/${conversationId}/status`, {
    method: "PATCH",
    body: { status },
  });
  return res.data;
};

export const addParticipant = async (
  conversationId: number,
  userId: number
): Promise<{ conversation: Conversation }> => {
  const res = await apiFetch(`/admin/messages/conversations/${conversationId}/participants`, {
    method: "POST",
    body: { userId },
  });
  return res.data;
};

export const getUnreadCount = async (): Promise<{ unreadCount: number }> => {
  const res = await apiFetch("/admin/messages/unread-count");
  return res.data;
};

// Customer endpoints
export const getCustomerConversations = async (): Promise<{ conversations: Conversation[] }> => {
  const res = await apiFetch("/messages/conversations");
  return res.data;
};

export const createSupportConversation = async (
  title?: string,
  userId?: number
): Promise<{ conversation: Conversation }> => {
  const body: any = { title };
  if (userId) {
    body.userId = userId;
  }
  const res = await apiFetch("/messages/conversations", {
    method: "POST",
    body,
  });
  return res.data;
};

export const getCustomerConversation = async (
  id: number
): Promise<{ conversation: Conversation }> => {
  const res = await apiFetch(`/messages/conversations/${id}`);
  return res.data;
};

export const getCustomerConversationMessages = async (
  conversationId: number,
  page: number = 1,
  limit: number = 50
): Promise<MessageListResponse> => {
  const res = await apiFetch(
    `/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
  );
  return res.data;
};

export const sendCustomerMessage = async (
  conversationId: number,
  data: SendMessageData
): Promise<{ message: Message }> => {
  const formData = new FormData();
  formData.append("content", data.content || "");

  if (data.attachments && data.attachments.length > 0) {
    data.attachments.forEach((file) => {
      formData.append("attachments", file);
    });
  }

  const res = await apiFetch(`/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: formData,
  });
  return res.data;
};

export const markCustomerMessagesAsRead = async (conversationId: number): Promise<void> => {
  await apiFetch(`/messages/conversations/${conversationId}/messages/read`, {
    method: "POST",
  });
};

