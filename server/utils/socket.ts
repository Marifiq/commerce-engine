import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import prisma from "../db.js";

interface SocketUser {
  userId: number;
  socketId: string;
  role: string;
}

// Map to store user connections (userId -> socketId[])
const userSockets = new Map<number, Set<string>>();

let io: SocketIOServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  // Configure CORS for Socket.IO
  // In development, allow localhost on any port, in production use FRONTEND_URL
  const getCorsOrigin = (): string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void) => {
    if (process.env.NODE_ENV === "development") {
      // Use a function to allow localhost on any port in development
      return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
          return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)
        }
        // Allow localhost on any port
        if (/^http:\/\/localhost:\d+$/.test(origin)) {
          return callback(null, true);
        }
        // Also allow the configured frontend URL
        const frontendUrl = process.env.FRONTEND_URL;
        if (frontendUrl && origin === frontendUrl) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      };
    }
    // In production, use the configured frontend URL
    return process.env.FRONTEND_URL || "http://localhost:3000";
  };

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: getCorsOrigin(),
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["authorization"],
    },
    allowEIO3: true, // Allow Engine.IO v3 clients for better compatibility
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded: any = await (promisify(jwt.verify) as any)(token, process.env.JWT_SECRET!);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      (socket as any).user = user;
      next();
    } catch (error: any) {
      next(new Error("Authentication error: " + error.message));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    const userId = user.id;

    // Add socket to user's connection set
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    console.log(`Socket connected: ${socket.id} for user ${userId}`);

    // Join conversation room
    socket.on("join-conversation", (conversationId: number) => {
      socket.join(`conversation-${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave-conversation", (conversationId: number) => {
      socket.leave(`conversation-${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
      console.log(`Socket disconnected: ${socket.id} for user ${userId}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket first.");
  }
  return io;
};

// Helper function to emit to a conversation room
export const emitToConversation = (conversationId: number, event: string, data: any) => {
  if (!io) return;
  io.to(`conversation-${conversationId}`).emit(event, data);
};

// Helper function to emit to a specific user
export const emitToUser = (userId: number, event: string, data: any) => {
  if (!io) return;
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.forEach((socketId) => {
      io!.to(socketId).emit(event, data);
    });
  }
};

// Helper function to check if user is online
export const isUserOnline = (userId: number): boolean => {
  const sockets = userSockets.get(userId);
  return sockets ? sockets.size > 0 : false;
};

