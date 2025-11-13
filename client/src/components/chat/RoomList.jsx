import { Fragment, useMemo, useState } from 'react';
import { Transition } from '@headlessui/react';
import {
  ChatBubbleLeftIcon,
  PlusCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../common/UserAvatar';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const RoomList = () => {
  const {
    rooms,
    unreadCounts,
    activeRoomId,
    selectRoom,
    createRoom,
    people,
    startDirectConversation,
    fetchUsers,
  } = useChat();
  const { presence } = useSocket();
  const { user } = useAuth();
  const [showPeople, setShowPeople] = useState(false);

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [rooms]);

  const handleCreateRoom = async () => {
    const name = window.prompt('Name this new tasting room');
    if (!name) return;
    const description = window.prompt('Describe the vibe (optional)') || '';
    const room = await createRoom({ name, description });
    selectRoom(room._id);
  };

  const togglePeople = async () => {
    if (!showPeople) {
      await fetchUsers();
    }
    setShowPeople((prev) => !prev);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreateRoom}
            className="flex-1 rounded-2xl bg-bean-600 py-2 text-sm font-semibold text-white shadow transition hover:bg-bean-500"
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <PlusCircleIcon className="h-5 w-5" />
              New room
            </span>
          </button>
          <button
            type="button"
            onClick={togglePeople}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bean-100 text-bean-500 transition hover:bg-bean-200"
          >
            <UserPlusIcon className="h-5 w-5" />
          </button>
        </div>

        {showPeople && (
          <div className="rounded-2xl border border-bean-100 bg-bean-50 p-3">
            <p className="text-xs font-semibold uppercase text-bean-400">Invite to a private booth</p>
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {people.map((person) => (
                <button
                  key={person._id}
                  type="button"
                  onClick={async () => {
                    const room = await startDirectConversation(person._id);
                    setShowPeople(false);
                    selectRoom(room._id);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left text-sm transition hover:bg-bean-100"
                >
                  <UserAvatar
                    name={person.username}
                    color={person.avatarColor}
                    size="36px"
                    isOnline={person.isOnline}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-bean-600">{person.username}</p>
                    <p className="text-[11px] text-bean-300">{person.favoriteDrink}</p>
                  </div>
                </button>
              ))}
              {people.length === 0 && (
                <p className="text-xs text-bean-300">
                  Invite new friends to the lounge to start brewing DMs.
                </p>
              )}
            </div>
          </div>
        )}

        {sortedRooms.map((room) => {
          const unread = unreadCounts[room._id] || 0;
          const isActive = room._id === activeRoomId;
          const isDirect = room.isDirect;
          const otherParticipant = room.participants.find(
            (participant) => participant._id !== user._id
          );
          const name = isDirect ? otherParticipant?.username : room.name;
          const avatarColor = otherParticipant?.avatarColor;
          const isOnline =
            isDirect && presence[otherParticipant?._id]?.isOnline
              ? presence[otherParticipant?._id].isOnline
              : room.participants.some((participant) => presence[participant._id]?.isOnline);

          return (
            <button
              key={room._id}
              type="button"
              onClick={() => selectRoom(room._id)}
              className={`w-full flex items-center gap-3 rounded-2xl p-3 transition ${
                isActive ? 'bg-bean-600 text-white shadow-barista' : 'hover:bg-bean-100'
              }`}
            >
              <div className="flex-shrink-0">
                {isDirect ? (
                  <UserAvatar
                    name={name}
                    color={avatarColor}
                    size="44px"
                    isOnline={isOnline}
                  />
                ) : (
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-bean-500 text-white shadow-inner shadow-bean-800/30">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-sm">{name}</p>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-bean-900">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-bean-200/80">
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span className="truncate">
                    {room.lastMessage
                      ? room.lastMessage.messageType === 'text' && room.lastMessage.content
                        ? room.lastMessage.content.slice(0, 60)
                        : room.lastMessage.messageType === 'image'
                        ? '📸 Shared an image'
                        : '📎 Shared a file'
                      : 'Start the conversation'}
                  </span>
                </div>
                {isDirect && (
                  <div className="mt-1 text-xs text-emerald-300">
                    {isOnline ? 'Online now' : 'Away'}
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {sortedRooms.length === 0 && (
          <Transition
            as={Fragment}
            show
            enter="transition duration-500 ease-out"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
          >
            <div className="rounded-3xl border border-dashed border-bean-200 bg-white/80 p-6 text-center shadow-sm">
              <p className="font-semibold text-bean-700">No conversations yet</p>
              <p className="mt-1 text-sm text-bean-400">
                Brew up a new room and invite your fellow coffee lovers!
              </p>
            </div>
          </Transition>
        )}
      </div>
    </div>
  );
};

export default RoomList;

