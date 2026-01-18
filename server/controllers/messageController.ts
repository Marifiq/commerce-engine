import { Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import multer from "multer";
import sharp from "sharp";
import { uploadMessageAttachment } from "../utils/supabaseStorage.js";
import { emitToConversation, emitToUser } from "../utils/socket.js";

// Multer configuration for message attachments
const multerStorage = multer.memoryStorage();

const multerFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Please upload only images, documents (PDF, DOC, DOCX), or videos (MP4)", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export const uploadMessageAttachments = upload.array("attachments", 10);

// Process message attachments
export const processMessageAttachments = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      req.body.processedAttachments = [];
      return next();
    }

    const processedAttachments: Array<{ filename: string; url: string; type: string; size: number }> = [];

    for (const file of files) {
      const mimeType = file.mimetype;
      let fileType: "image" | "document" | "video";
      let filename: string;
      let buffer: Buffer = file.buffer;

      if (mimeType.startsWith("image/")) {
        fileType = "image";
        // Process images with Sharp (convert to webp)
        const ext = "webp";
        filename = `message-image-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        buffer = await sharp(file.buffer)
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
          .toFormat("webp")
          .webp({ quality: 85 })
          .toBuffer();
      } else if (mimeType.startsWith("video/")) {
        fileType = "video";
        const ext = file.originalname.split(".").pop() || "mp4";
        filename = `message-video-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      } else {
        fileType = "document";
        const ext = file.originalname.split(".").pop() || "pdf";
        filename = `message-doc-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      }

      const url = await uploadMessageAttachment(buffer, filename, fileType);
      processedAttachments.push({
        filename: file.originalname,
        url,
        type: fileType,
        size: file.size,
      });
    }

    req.body.processedAttachments = processedAttachments;
    next();
  }
);

// ADMIN ENDPOINTS

// Get all conversations (admin)
export const getAllConversations = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { type, status, search, page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        {
          participants: {
            some: {
              user: {
                OR: [
                  { name: { contains: search as string, mode: "insensitive" } },
                  { email: { contains: search as string, mode: "insensitive" } },
                ],
              },
            },
          },
        },
        {
          messages: {
            some: {
              content: { contains: search as string, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.conversation.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        conversations,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }
);

// Get conversation by ID (admin)
export const getConversation = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { conversation },
    });
  }
);

// Create conversation (admin)
export const createConversation = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { type, title, participantIds } = req.body;

    if (!type || (type !== "support" && type !== "internal")) {
      return next(new AppError("Type must be 'support' or 'internal'", 400));
    }

    const currentUserId = req.user!.id!;
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (!currentUser) {
      return next(new AppError("User not found", 404));
    }

    let allParticipantIds: number[] = [];
    let participantRoles: { userId: number; role: string }[] = [];

    if (type === "internal") {
      // Internal conversations: require participantIds and all must be admins
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return next(new AppError("Internal conversations require at least one participant", 400));
      }

      allParticipantIds = [...new Set([currentUserId, ...participantIds.map((id: any) => parseInt(id))])];

      // Verify all participants exist and are admins
      const participants = await prisma.user.findMany({
        where: {
          id: { in: allParticipantIds },
          role: "admin",
        },
      });

      if (participants.length !== allParticipantIds.length) {
        return next(new AppError("One or more participants not found or are not admins", 400));
      }

      participantRoles = allParticipantIds.map((userId) => ({
        userId,
        role: "admin",
      }));
    } else {
      // Support conversations
      if (currentUser.role === "admin") {
        // Admin creating support conversation with a user
        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
          return next(new AppError("Support conversations require at least one user participant", 400));
        }

        const userIds = participantIds.map((id: any) => parseInt(id));
        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            role: "user", // Only regular users for support
          },
        });

        if (users.length !== userIds.length) {
          return next(new AppError("One or more users not found or invalid", 400));
        }

        allParticipantIds = [currentUserId, ...userIds];
        participantRoles = allParticipantIds.map((userId) => ({
          userId,
          role: userId === currentUserId ? "admin" : "customer",
        }));
      } else {
        // Customer creating support conversation - find an admin
        const admin = await prisma.user.findFirst({
          where: { role: "admin" },
        });

        if (!admin) {
          return next(new AppError("No admin available", 500));
        }

        allParticipantIds = [currentUserId, admin.id];
        participantRoles = [
          { userId: currentUserId, role: "customer" },
          { userId: admin.id, role: "admin" },
        ];
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        type,
        title: title || null,
        participants: {
          create: participantRoles,
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Emit new conversation event to participants
    allParticipantIds.forEach((userId) => {
      emitToUser(userId, "new-conversation", { conversation });
    });

    res.status(201).json({
      status: "success",
      data: { conversation },
    });
  }
);

// Get messages in conversation (admin)
export const getConversationMessages = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: parseInt(id) },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.message.count({ where: { conversationId: parseInt(id) } }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }
);

// Send message (admin)
export const sendMessage = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { content } = req.body;
    const attachments = req.body.processedAttachments || [];

    if (!content || content.trim().length === 0) {
      if (attachments.length === 0) {
        return next(new AppError("Message content or attachment is required", 400));
      }
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    // Check if user is a participant
    const currentUserId = Number(req.user!.id!);
    const isParticipant = conversation.participants.some(
      (p) => Number(p.userId) === currentUserId
    );

    // If admin is not a participant, add them automatically (for admin endpoints)
    if (!isParticipant) {
      // Verify user is admin (should already be checked by restrictTo middleware, but double-check)
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      });

      if (!user || user.role !== "admin") {
        return next(new AppError("You are not a participant in this conversation", 403));
      }

      // Add admin as participant (use upsert to handle race conditions)
      try {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: parseInt(id),
            userId: currentUserId,
            role: "admin",
          },
        });
      } catch (error: any) {
        // If participant already exists (unique constraint), that's fine
        if (error.code !== "P2002") {
          throw error;
        }
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: req.user!.id!,
        content: content || "",
        attachments: {
          create: attachments.map((att: any) => ({
            filename: att.filename,
            url: att.url,
            type: att.type,
            size: att.size,
          })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { lastMessageAt: new Date() },
    });

    // Mark message as read for sender
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: parseInt(id),
        userId: req.user!.id!,
      },
      data: {
        isRead: true,
        lastReadAt: new Date(),
      },
    });

    // Emit new message event to conversation room
    emitToConversation(parseInt(id), "new-message", { message });

    res.status(201).json({
      status: "success",
      data: { message },
    });
  }
);

// Mark messages as read (admin)
export const markMessagesAsRead = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: parseInt(id),
        userId: req.user!.id!,
      },
      data: {
        isRead: true,
        lastReadAt: new Date(),
      },
    });

    await prisma.message.updateMany({
      where: {
        conversationId: parseInt(id),
        senderId: { not: req.user!.id! },
      },
      data: {
        isRead: true,
      },
    });

    emitToConversation(parseInt(id), "message-read", {
      conversationId: parseInt(id),
      userId: req.user!.id!,
    });

    res.status(200).json({
      status: "success",
      message: "Messages marked as read",
    });
  }
);

// Update conversation status (admin)
export const updateConversationStatus = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["open", "closed", "archived"].includes(status)) {
      return next(new AppError("Status must be 'open', 'closed', or 'archived'", 400));
    }

    const conversation = await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });

    emitToConversation(parseInt(id), "conversation-updated", { conversation });

    res.status(200).json({
      status: "success",
      data: { conversation },
    });
  }
);

// Add participant to conversation (admin - for internal conversations)
export const addParticipant = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { userId } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    if (conversation.type !== "internal") {
      return next(new AppError("Can only add participants to internal conversations", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user || user.role !== "admin") {
      return next(new AppError("User not found or is not an admin", 400));
    }

    // Check if already a participant
    const existing = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: parseInt(id),
          userId: parseInt(userId),
        },
      },
    });

    if (existing) {
      return next(new AppError("User is already a participant", 400));
    }

    await prisma.conversationParticipant.create({
      data: {
        conversationId: parseInt(id),
        userId: parseInt(userId),
        role: "admin",
      },
    });

    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });

    emitToConversation(parseInt(id), "conversation-updated", { conversation: updatedConversation });
    emitToUser(parseInt(userId), "new-conversation", { conversation: updatedConversation });

    res.status(200).json({
      status: "success",
      data: { conversation: updatedConversation },
    });
  }
);

// Get unread count (admin)
export const getUnreadCount = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const unreadCount = await prisma.conversationParticipant.count({
      where: {
        userId: req.user!.id!,
        isRead: false,
      },
    });

    res.status(200).json({
      status: "success",
      data: { unreadCount },
    });
  }
);

// CUSTOMER ENDPOINTS

// Get customer conversations
export const getCustomerConversations = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const conversations = await prisma.conversation.findMany({
      where: {
        type: "support",
        participants: {
          some: {
            userId: req.user!.id!,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    res.status(200).json({
      status: "success",
      data: { conversations },
    });
  }
);

// Create support conversation (customer)
export const createSupportConversation = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { title, userId } = req.body;
    const currentUserId = req.user!.id!;

    // If userId is provided, create a user-to-user conversation
    if (userId && userId !== currentUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true, role: true },
      });

      if (!targetUser) {
        return next(new AppError("User not found", 404));
      }

      if (targetUser.role === "admin") {
        return next(new AppError("Cannot create conversation with admin this way", 400));
      }

      // Check if conversation already exists between these users
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: "support",
          participants: {
            some: {
              userId: currentUserId,
            },
          },
        },
        include: {
          participants: true,
        },
      });

      // If conversation exists and includes both users, return it
      if (existingConversation) {
        const participantIds = existingConversation.participants.map((p) => p.userId);
        if (
          participantIds.includes(currentUserId) &&
          participantIds.includes(parseInt(userId))
        ) {
          const conversation = await prisma.conversation.findUnique({
            where: { id: existingConversation.id },
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      profileImage: true,
                      role: true,
                    },
                  },
                },
              },
            },
          });

          return res.status(200).json({
            status: "success",
            data: { conversation },
          });
        }
      }

      // Create new conversation between users (admin will be added if needed for support)
      const admin = await prisma.user.findFirst({
        where: { role: "admin" },
      });

      const participantData = [
        { userId: currentUserId, role: "customer" },
        { userId: parseInt(userId), role: "customer" },
      ];

      if (admin) {
        participantData.push({ userId: admin.id, role: "admin" });
      }

      const conversation = await prisma.conversation.create({
        data: {
          type: "support",
          title: title || null,
          participants: {
            create: participantData,
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      participantData.forEach((p) => {
        emitToUser(p.userId, "new-conversation", { conversation });
      });

      return res.status(201).json({
        status: "success",
        data: { conversation },
      });
    }

    // Default: Create support conversation with admin
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (!admin) {
      return next(new AppError("No admin available", 500));
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: "support",
        title: title || null,
        participants: {
          create: [
            { userId: currentUserId, role: "customer" },
            { userId: admin.id, role: "admin" },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });

    emitToUser(admin.id, "new-conversation", { conversation });
    emitToUser(req.user!.id!, "new-conversation", { conversation });

    res.status(201).json({
      status: "success",
      data: { conversation },
    });
  }
);

// Send message (customer)
export const sendCustomerMessage = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { content } = req.body;
    const attachments = req.body.processedAttachments || [];

    if (!content || content.trim().length === 0) {
      if (attachments.length === 0) {
        return next(new AppError("Message content or attachment is required", 400));
      }
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    if (conversation.type !== "support") {
      return next(new AppError("Invalid conversation type", 400));
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === req.user!.id!
    );

    if (!isParticipant) {
      return next(new AppError("You are not a participant in this conversation", 403));
    }

    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(id),
        senderId: req.user!.id!,
        content: content || "",
        attachments: {
          create: attachments.map((att: any) => ({
            filename: att.filename,
            url: att.url,
            type: att.type,
            size: att.size,
          })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    await prisma.conversation.update({
      where: { id: parseInt(id) },
      data: { lastMessageAt: new Date() },
    });

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: parseInt(id),
        userId: req.user!.id!,
      },
      data: {
        isRead: true,
        lastReadAt: new Date(),
      },
    });

    emitToConversation(parseInt(id), "new-message", { message });

    res.status(201).json({
      status: "success",
      data: { message },
    });
  }
);

