import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

const reactionOptions = ['👍', '❤️', '😂', '☕', '🔥'];

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const { addReaction } = useChat();
  const [showReactions, setShowReactions] = useState(false);

  const isOwnMessage = message.sender._id?.toString() === user._id?.toString();
  const formattedTime = format(new Date(message.createdAt), 'HH:mm');
  const readBy = Array.isArray(message.readBy)
    ? message.readBy.map((reader) => reader?.toString?.() || reader)
    : [];
  const deliveredTo = Array.isArray(message.deliveredTo)
    ? message.deliveredTo.map((delivered) => delivered?.toString?.() || delivered)
    : [];
  const readByCount = readBy.length;
  const deliveredToCount = deliveredTo.length;
  const fileMeta = message.fileMeta || {};

  const groupedReactions = useMemo(() => {
    const map = {};
    (message.reactions || []).forEach((reaction) => {
      if (!map[reaction.emoji]) {
        map[reaction.emoji] = [];
      }
      map[reaction.emoji].push(reaction.user.username);
    });
    return map;
  }, [message.reactions]);

  return (
    <div className={`group flex items-end gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {!isOwnMessage && (
        <UserAvatar
          name={message.sender.username}
          color={message.sender.avatarColor}
          size="36px"
        />
      )}
      <div className={`max-w-[70%] space-y-1 ${isOwnMessage ? 'items-end text-right' : ''}`}>
        <div
          className={`relative rounded-3xl px-4 py-3 text-sm shadow-md transition ${
            isOwnMessage
              ? 'bg-bean-600 text-white shadow-bean-900/30'
              : 'bg-white text-bean-900 shadow-bean-400/30'
          }`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {!isOwnMessage && (
            <p className="mb-1 text-xs font-semibold text-bean-400">
              {message.sender.username}
            </p>
          )}
          {message.messageType === 'text' && <p>{message.content}</p>}
          {message.messageType === 'image' && fileMeta.url && (
            <img
              src={fileMeta.url}
              alt={fileMeta.fileName}
              className="mt-2 max-h-60 w-full rounded-2xl object-cover"
            />
          )}
          {message.messageType === 'file' && fileMeta.url && (
            <a
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs underline"
              href={fileMeta.url}
              target="_blank"
              rel="noreferrer"
            >
              📎 {fileMeta.fileName}
            </a>
          )}

          <div className="mt-2 flex items-center justify-end gap-2 text-[11px] opacity-80">
            <span>{formattedTime}</span>
            {isOwnMessage && (
              <span>{readByCount > 1 ? `Read by ${readByCount - 1}` : deliveredToCount > 1 ? 'Delivered' : 'Sent'}</span>
            )}
          </div>

          {showReactions && (
            <div
              className={`absolute bottom-full mb-2 flex gap-1 rounded-full bg-white/90 px-2 py-1 text-xl shadow ${
                isOwnMessage ? 'right-3' : 'left-3'
              }`}
            >
              {reactionOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="transition hover:scale-110"
                  onClick={() => addReaction(message._id, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-1 text-bean-700 opacity-0 transition hover:bg-white focus-visible:opacity-100 focus-visible:outline-none ${
              isOwnMessage ? 'left-[-30px]' : 'right-[-30px]'
            } group-hover:opacity-100`}
            onClick={() => setShowReactions((prev) => !prev)}
          >
            <FaceSmileIcon className="h-4 w-4" />
          </button>
        </div>

        {(message.reactions || []).length > 0 && (
          <div
            className={`flex flex-wrap gap-1 text-xs ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 shadow"
              >
                <span>{emoji}</span>
                <span className="font-medium text-bean-700">{users.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

