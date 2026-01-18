export interface MessageAttachment {
  id: number;
  messageId: number;
  filename: string;
  url: string;
  type: "image" | "document" | "video";
  size?: number;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  sender: {
    id: number;
    name: string;
    email: string;
    profileImage?: string | null;
    role: string;
  };
  content: string;
  attachments: MessageAttachment[];
  isRead: boolean;
  createdAt: string;
}

export interface ConversationParticipant {
  id: number;
  conversationId: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    profileImage?: string | null;
    role: string;
  };
  role: "admin" | "customer";
  isRead: boolean;
  lastReadAt?: string | null;
  joinedAt: string;
}

export interface Conversation {
  id: number;
  type: "support" | "internal";
  title?: string | null;
  status: "open" | "closed" | "archived";
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages?: Message[];
}

export interface CreateConversationData {
  type: "support" | "internal";
  title?: string;
  participantIds?: number[];
}

export interface SendMessageData {
  content: string;
  attachments?: File[];
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

