import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import RoomList from '../components/chat/RoomList';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import ChatHeader from '../components/chat/ChatHeader';
import { useChat } from '../context/ChatContext';

const ChatPage = () => {
  const { rooms, activeRoomId, selectRoom } = useChat();

  useEffect(() => {
    if (!activeRoomId && rooms.length) {
      selectRoom(rooms[0]._id);
    }
  }, [activeRoomId, rooms, selectRoom]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bean-100/70 via-bean-50 to-white p-6">
      <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-6xl gap-6 rounded-4xl">
        <aside className="flex w-80 flex-col rounded-3xl bg-white shadow-xl shadow-bean-200/40">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-bean-700">Your Roastery</h2>
            <p className="mt-1 text-xs text-bean-400">
              Hang out across lounge rooms & private tasting booths.
            </p>
          </div>
          <RoomList />
        </aside>
        <main className="flex-1 overflow-hidden rounded-3xl bg-bean-50/60 p-4 shadow-xl shadow-bean-200/60">
          <div className="flex h-full flex-col gap-4">
            <ChatHeader />
            <div className="flex-1 rounded-3xl bg-white shadow-inner shadow-bean-800/10">
              {activeRoomId ? (
                <MessageList />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-bean-300">
                  <p className="text-xl font-semibold">Select a room to start chatting</p>
                  <p className="mt-2 text-sm">
                    The aroma of conversation is strongest when shared.
                  </p>
                </div>
              )}
            </div>
            {activeRoomId && <MessageInput />}
          </div>
        </main>
      </div>
      <Outlet />
    </div>
  );
};

export default ChatPage;

