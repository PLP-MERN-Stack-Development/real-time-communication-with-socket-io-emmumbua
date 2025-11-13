import { useState } from 'react';
import { MagnifyingGlassIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import { useChat } from '../../context/ChatContext';

const ChatHeader = () => {
  const [term, setTerm] = useState('');
  const { user, logout } = useAuth();
  const { search, searchLoading, searchResults, setSearchResults } = useChat();

  const handleSearch = (event) => {
    const value = event.target.value;
    setTerm(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    search(value);
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-lg shadow-bean-900/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3rem] text-bean-300">BeanStream Lounge</p>
          <h1 className="mt-1 text-2xl font-semibold text-bean-800">
            Welcome back, {user.username}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => Notification.requestPermission()}
            className="rounded-full bg-bean-100 p-2 text-bean-500 transition hover:bg-bean-200"
          >
            <BellAlertIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 rounded-full bg-bean-100 px-4 py-2">
            <UserAvatar name={user.username} color={user.avatarColor} size="38px" isOnline />
            <div className="text-xs">
              <p className="font-semibold text-bean-700">{user.username}</p>
              <button
                type="button"
                onClick={logout}
                className="text-[11px] text-bean-400 underline-offset-4 hover:underline"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-bean-300" />
        <input
          value={term}
          onChange={handleSearch}
          placeholder="Search the conversation roastery..."
          className="w-full rounded-full border border-bean-100 bg-bean-50 py-3 pl-12 pr-4 text-sm text-bean-800 placeholder:text-bean-300 focus:border-bean-400 focus:outline-none"
        />
        {searchLoading && (
          <span className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 animate-pulse text-xs text-bean-300">
            Brewing...
          </span>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="max-h-60 overflow-y-auto rounded-2xl border border-bean-100 bg-bean-50 p-4 text-sm text-bean-700 custom-scrollbar">
          {searchResults.map((result) => (
            <div key={result._id} className="mb-3 last:mb-0">
              <p className="font-semibold">{result.sender.username}</p>
              <p className="text-bean-500">{result.content}</p>
              <p className="text-[11px] uppercase tracking-wide text-bean-300">
                {new Date(result.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHeader;

