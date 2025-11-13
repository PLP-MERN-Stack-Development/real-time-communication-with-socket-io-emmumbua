import { useCallback, useEffect, useRef, useState } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useFileUpload } from '../../hooks/useFileUpload';

const MessageInput = () => {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const { activeRoomId, sendMessage } = useChat();
  const { emit } = useSocket();
  const { upload, uploading } = useFileUpload();
  const typingTimeoutRef = useRef(null);

  const handleTyping = useCallback(
    (isTyping) => {
      if (!activeRoomId) return;
      emit(isTyping ? 'typing:start' : 'typing:stop', { roomId: activeRoomId });
    },
    [activeRoomId, emit]
  );

  useEffect(() => {
    return () => {
      handleTyping(false);
    };
  }, [handleTyping]);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [value]);

  const resetTypingState = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => handleTyping(false), 1200);
  };

  const handleChange = (event) => {
    setValue(event.target.value);
    handleTyping(true);
    resetTypingState();
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await sendTextMessage();
    }
  };

  const sendTextMessage = async () => {
    if (!value.trim() || !activeRoomId) return;
    try {
      await sendMessage(activeRoomId, { content: value, messageType: 'text' });
    } catch (error) {
      toast.error(error.message);
    }

    setValue('');
    handleTyping(false);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await sendTextMessage();
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeRoomId) return;

    try {
      const data = await upload(file);
      const messageType = file.type.startsWith('image') ? 'image' : 'file';
      try {
        await sendMessage(activeRoomId, {
          messageType,
          fileMeta: data,
          content: messageType === 'file' ? `Shared ${file.name}` : '',
        });
        toast.success('File shared successfully');
      } catch (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      event.target.value = null;
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl bg-white p-4 shadow-lg shadow-bean-900/10">
      <div className="flex items-end gap-4">
        <label
          htmlFor="file-upload"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bean-100 text-bean-600 transition hover:bg-bean-200 hover:text-bean-800"
        >
          <PaperClipIcon className="h-6 w-6" />
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Share your latest brew..."
          className="max-h-32 flex-1 resize-none bg-transparent text-base text-bean-900 placeholder:text-bean-300 focus:outline-none"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bean-100 text-bean-500 transition hover:bg-bean-200"
            onClick={() => toast('Voice messages are coming soon! 🎙️', { icon: '🎙️' })}
          >
            <MicrophoneIcon className="h-6 w-6" />
          </button>
          <button
            type="submit"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bean-600 text-white transition hover:bg-bean-500"
            disabled={!value.trim()}
          >
            <PaperAirplaneIcon className="h-5 w-5 -rotate-12" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;

