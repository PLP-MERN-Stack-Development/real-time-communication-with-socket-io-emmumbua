import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';

const MessageList = () => {
  const {
    messages,
    activeRoomId,
    fetchMessages,
    pagination,
    typingState,
  } = useChat();
  const { user } = useAuth();
  const listRef = useRef(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const roomMessages = useMemo(() => messages[activeRoomId] || [], [messages, activeRoomId]);
  const roomPagination = pagination[activeRoomId] || { hasMore: false };
  const typers = typingState[activeRoomId] || [];

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [activeRoomId]);

  useEffect(() => {
    if (!listRef.current) return undefined;
    const el = listRef.current;

    const handleScroll = async () => {
      if (el.scrollTop === 0 && roomPagination.hasMore && !isFetchingMore) {
        setIsFetchingMore(true);
        const oldest = roomMessages[0];
        await fetchMessages(activeRoomId, { before: oldest?.createdAt });
        requestAnimationFrame(() => {
          if (el.scrollHeight > el.clientHeight) {
            el.scrollTop = 10;
          }
        });
        setIsFetchingMore(false);
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [activeRoomId, fetchMessages, roomMessages, roomPagination.hasMore, isFetchingMore]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current;
    el.scrollTop = el.scrollHeight;
  }, [roomMessages.length]);

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-6 custom-scrollbar">
        {roomPagination.hasMore && (
          <div className="flex items-center justify-center gap-2 text-sm text-bean-300">
            <ArrowPathIcon className={`h-4 w-4 ${isFetchingMore ? 'animate-spin' : ''}`} />
            <span>Brewing older messages...</span>
          </div>
        )}
        {roomMessages.map((message) => (
          <MessageBubble key={message._id || message.tempId} message={message} />
        ))}
      </div>
      {typers.length > 0 && (
        <div className="px-6 pb-4 text-sm text-bean-400">
          {typers
            .filter((typer) => typer.userId !== user._id)
            .map((typer) => typer.username)
            .join(', ')}{' '}
          {typers.length === 1 ? 'is' : 'are'} pouring a message...
        </div>
      )}
    </div>
  );
};

export default MessageList;

