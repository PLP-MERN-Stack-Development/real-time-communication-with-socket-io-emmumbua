import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { playNotificationSound } from '../utils/sounds';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const [connected, setConnected] = useState(false);
  const [typingState, setTypingState] = useState({});
  const [presence, setPresence] = useState({});

  const connectSocket = useCallback(() => {
    if (!token || socketRef.current) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      reconnectAttempts.current = 0;
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current > 3) {
        toast.error('Having trouble reconnecting to the roastery...');
      } else {
        toast('Reconnecting to the bean stream...', { icon: '🔄' });
      }
      console.error('Socket connection error', error);
    });

    socket.on('typing:update', ({ roomId, typers }) => {
      setTypingState((prev) => ({ ...prev, [roomId]: typers }));
    });

    socket.on('presence:update', (update) => {
      setPresence((prev) => ({
        ...prev,
        [update.userId]: {
          isOnline: update.isOnline,
          lastSeen: update.lastSeen,
        },
      }));
    });

    socket.on('notifications:new', (payload) => {
      playNotificationSound();
      toast.success(`New message just dropped!`, {
        icon: '📬',
      });
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('BeanStream Lounge', {
            body: payload.content || 'New message waiting for you',
            tag: payload.roomId,
          });
        }
      }
    });
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connectSocket, isAuthenticated]);

  const emit = useCallback((event, payload, ack) => {
    if (socketRef.current) {
      socketRef.current.emit(event, payload, ack);
    }
  }, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      emit,
      connected,
      typingState,
      presence,
    }),
    [connected, emit, typingState, presence]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

