import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getApiBaseUrlWithoutVersion } from "@/lib/config/env";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  emit: (event: string, data: any) => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());

  useEffect(() => {
    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      console.warn("No token found, socket connection skipped");
      return;
    }

    const baseUrl = getApiBaseUrlWithoutVersion() || 'http://localhost:3001';
    const socketInstance = io(baseUrl, {
      auth: {
        token,
      },
      transports: ["polling", "websocket"], // Try polling first, then websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      // Only log meaningful errors, suppress common transport errors
      // These are expected during connection attempts and reconnections
      const suppressErrors = [
        "xhr poll error",
        "websocket",
        "transport close",
        "transport error",
        "connection timeout",
      ];
      
      const shouldSuppress = suppressErrors.some((suppress) =>
        error.message?.toLowerCase().includes(suppress)
      );
      
      if (!shouldSuppress) {
        console.error("Socket connection error:", error.message);
      }
      setIsConnected(false);
    });

    // Handle reconnection events
    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
    });

    socketInstance.on("reconnect_failed", () => {
      console.warn("Socket reconnection failed after all attempts");
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      // Clean up all listeners
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          socketInstance.off(event, callback);
        });
      });
      listenersRef.current.clear();

      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  const joinConversation = useCallback(
    (conversationId: number) => {
      if (socketRef.current) {
        socketRef.current.emit("join-conversation", conversationId);
      }
    },
    []
  );

  const leaveConversation = useCallback(
    (conversationId: number) => {
      if (socketRef.current) {
        socketRef.current.emit("leave-conversation", conversationId);
      }
    },
    []
  );

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);

      // Track listener for cleanup
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event)!.add(callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
        listenersRef.current.get(event)?.delete(callback);
      } else {
        // Remove all listeners for this event
        const callbacks = listenersRef.current.get(event);
        if (callbacks) {
          callbacks.forEach((cb) => {
            socketRef.current?.off(event, cb);
          });
          listenersRef.current.delete(event);
        }
      }
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    on,
    off,
    emit,
  };
};

