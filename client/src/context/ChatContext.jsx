import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import debounce from 'lodash.debounce';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { playNotificationSound } from '../utils/sounds';

const ChatContext = createContext(null);

const initialState = {
  rooms: [],
  messages: {},
  pagination: {},
  unreadCounts: {},
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ROOMS':
      return {
        ...state,
        rooms: action.payload.rooms,
        unreadCounts: action.payload.unreadCounts,
      };
    case 'ADD_ROOM':
      return {
        ...state,
        rooms: [...state.rooms, action.payload],
      };
    case 'UPDATE_ROOM_LAST_MESSAGE':
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room._id === action.payload.roomId
            ? {
                ...room,
                lastMessage: action.payload.message,
                updatedAt: action.payload.message.createdAt,
              }
            : room
        ),
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]: action.payload.messages,
        },
        pagination: {
          ...state.pagination,
          [action.payload.roomId]: action.payload.pagination,
        },
      };
    case 'APPEND_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]: [
            ...action.payload.messages,
            ...(state.messages[action.payload.roomId] || []),
          ],
        },
        pagination: {
          ...state.pagination,
          [action.payload.roomId]: action.payload.pagination,
        },
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]: [
            ...(state.messages[action.payload.roomId] || []),
            action.payload.message,
          ],
        },
      };
    case 'UPDATE_REACTIONS':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]: (state.messages[action.payload.roomId] || []).map((msg) =>
            msg._id === action.payload.messageId
              ? { ...msg, reactions: action.payload.reactions }
              : msg
          ),
        },
      };
    case 'MARK_READ':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]: (state.messages[action.payload.roomId] || []).map((msg) =>
            action.payload.messageIds.includes(msg._id)
              ? {
                  ...msg,
                  readBy: Array.from(new Set([...(msg.readBy || []), action.payload.userId])),
                }
              : msg
          ),
        },
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.roomId]: Math.max(
            0,
            (state.unreadCounts[action.payload.roomId] || 0) - action.payload.messageIds.length
          ),
        },
      };
    case 'INCREMENT_UNREAD':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.roomId]: (state.unreadCounts[action.payload.roomId] || 0) + 1,
        },
      };
    case 'RESET_UNREAD':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.roomId]: 0,
        },
      };
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const { user } = useAuth();
  const { emit, socket, typingState } = useSocket();
  const [people, setPeople] = useState([]);

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const response = await api.get('/rooms');
      const rooms = response.data;
      const unreadCounts = {};
      rooms.forEach((room) => {
        unreadCounts[room._id] = 0;
      });
      dispatch({ type: 'SET_ROOMS', payload: { rooms, unreadCounts } });
      if (!activeRoomId && rooms.length) {
        setActiveRoomId(rooms[0]._id);
      }
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoadingRooms(false);
    }
  }, [activeRoomId]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setPeople(response.data);
    } catch (error) {
      toast.error('Failed to load baristas');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchUsers();
    }
  }, [fetchRooms, fetchUsers, user]);

  const fetchMessages = useCallback(
    async (roomId, options = {}) => {
      try {
        const params = {};
        if (options.before) params.before = options.before;
        if (options.limit) params.limit = options.limit;

        const response = await api.get(`/messages/${roomId}`, { params });
        const { messages, hasMore } = response.data;
        if (options.before) {
          dispatch({
            type: 'APPEND_MESSAGES',
            payload: {
              roomId,
              messages,
              pagination: { hasMore, lastLoaded: messages[0]?.createdAt || null },
            },
          });
        } else {
          dispatch({
            type: 'SET_MESSAGES',
            payload: {
              roomId,
              messages,
              pagination: { hasMore, lastLoaded: messages[0]?.createdAt || null },
            },
          });
        }
      } catch (error) {
        toast.error('Could not load messages');
      }
    },
    []
  );

  const debouncedSearch = useMemo(
    () =>
      debounce(async (term) => {
        if (!term || term.length < 2) {
          setSearchResults([]);
          setSearchLoading(false);
          return;
        }
        try {
          const response = await api.get('/messages/search', { params: { term } });
          setSearchResults(response.data);
        } catch (error) {
          toast.error('Search failed');
        } finally {
          setSearchLoading(false);
        }
      }, 300),
    []
  );

  const search = useCallback(
    (term) => {
      setSearchLoading(true);
      debouncedSearch(term);
    },
    [debouncedSearch]
  );

  const createRoom = useCallback(
    async ({ name, description, participants }) => {
      const response = await api.post('/rooms', { name, description, participants });
      dispatch({ type: 'ADD_ROOM', payload: response.data });
      toast.success(`Created ${response.data.name}`);
      setActiveRoomId(response.data._id);
      return response.data;
    },
    []
  );

  const startDirectConversation = useCallback(
    async (otherUserId) => {
      const response = await api.post('/rooms/direct', { otherUserId });
      dispatch({ type: 'ADD_ROOM', payload: response.data });
      toast.success('Opened a private tasting booth ☕');
       setActiveRoomId(response.data._id);
      return response.data;
    },
    []
  );

  const sendMessage = useCallback(
    async (roomId, payload) =>
      new Promise((resolve, reject) => {
        emit(
          'chat:message',
          {
            roomId,
            ...payload,
          },
          (ack) => {
            if (ack?.status === 'ok') {
              resolve(ack.messageId);
            } else {
              reject(new Error(ack?.message || 'Message failed to send'));
            }
          }
        );
      }),
    [emit]
  );

  const markAsRead = useCallback(
    async (roomId, messageIds) => {
      if (!user) return;
      if (!messageIds.length) return;
      dispatch({
        type: 'MARK_READ',
        payload: { roomId, messageIds, userId: user._id },
      });
      emit('chat:read', { roomId, messageIds });
      await api.post('/messages/read', { messageIds });
    },
    [emit, user]
  );

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { roomId: message.room, message },
      });

      dispatch({
        type: 'UPDATE_ROOM_LAST_MESSAGE',
        payload: { roomId: message.room, message },
      });

      if (message.room !== activeRoomId) {
        dispatch({
          type: 'INCREMENT_UNREAD',
          payload: { roomId: message.room },
        });
        playNotificationSound();
      } else {
        emit('chat:delivered', { messageId: message._id });
        markAsRead(message.room, [message._id]);
      }
    };

    const handleReaction = ({ messageId, reactions }) => {
      const roomEntry = Object.entries(state.messages).find(([, msgs]) =>
        msgs.some((msg) => msg._id === messageId)
      );
      if (!roomEntry) return;
      const [roomId] = roomEntry;
      dispatch({
        type: 'UPDATE_REACTIONS',
        payload: { roomId, messageId, reactions },
      });
    };

    const handleReadReceipt = ({ roomId, readerId, messageIds }) => {
      dispatch({
        type: 'MARK_READ',
        payload: { roomId, messageIds, userId: readerId },
      });
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:reaction', handleReaction);
    socket.on('chat:read_receipt', handleReadReceipt);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:reaction', handleReaction);
      socket.off('chat:read_receipt', handleReadReceipt);
    };
  }, [socket, activeRoomId, emit, markAsRead, state.messages]);

  const selectRoom = useCallback(
    async (roomId) => {
      setActiveRoomId(roomId);
      if (!state.messages[roomId]) {
        await fetchMessages(roomId);
      }
      const unreadMessages = (state.messages[roomId] || []).filter(
        (msg) => !(msg.readBy || []).includes(user._id)
      );
      if (unreadMessages.length) {
        const ids = unreadMessages.map((msg) => msg._id);
        markAsRead(roomId, ids);
      }
      dispatch({ type: 'RESET_UNREAD', payload: { roomId } });
    },
    [fetchMessages, markAsRead, state.messages, user?._id]
  );

  const addReaction = useCallback(
    (messageId, emoji) =>
      new Promise((resolve, reject) => {
        emit('chat:reaction', { messageId, emoji }, (ack) => {
          if (ack?.status === 'ok') {
            resolve();
          } else {
            reject(new Error(ack?.message || 'Could not add reaction'));
          }
        });
      }),
    [emit]
  );

  const value = useMemo(
    () => ({
      rooms: state.rooms,
      messages: state.messages,
      pagination: state.pagination,
      unreadCounts: state.unreadCounts,
      activeRoomId,
      selectRoom,
      fetchRooms,
      fetchMessages,
      sendMessage,
      createRoom,
      startDirectConversation,
      people,
      fetchUsers,
      createRoom,
      startDirectConversation,
      people,
      fetchUsers,
      loadingRooms,
      typingState,
      markAsRead,
      addReaction,
      search,
      searchResults,
      searchLoading,
      setSearchResults,
    }),
    [
      state.rooms,
      state.messages,
      state.pagination,
      state.unreadCounts,
      activeRoomId,
      selectRoom,
      fetchRooms,
      fetchMessages,
      sendMessage,
      createRoom,
      startDirectConversation,
      people,
      fetchUsers,
      loadingRooms,
      typingState,
      markAsRead,
      addReaction,
      search,
      searchResults,
      searchLoading,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

