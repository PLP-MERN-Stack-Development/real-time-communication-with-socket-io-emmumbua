const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const ACTIVE_TYPERS = new Map();

const emitTypingUsers = (namespace, roomId) => {
  const typers = Array.from(ACTIVE_TYPERS.values())
    .filter((typer) => typer.roomId === roomId)
    .map((typer) => ({
      userId: typer.userId,
      username: typer.username,
    }));
  namespace.to(roomId).emit('typing:update', { roomId, typers });
};

const registerChatHandlers = ({ io, socket, onlineUsers }) => {
  const userObjectId = socket.user._id;
  const userId = userObjectId.toString();

  const notifyPresence = async (status) => {
    await User.findByIdAndUpdate(userId, {
      isOnline: status,
      socketId: status ? socket.id : null,
      lastSeen: new Date(),
    });
    io.emit('presence:update', {
      userId,
      isOnline: status,
      lastSeen: new Date(),
    });
  };

  const joinUserRooms = async () => {
    const rooms = await Room.find({ participants: userObjectId });
    rooms.forEach((room) => {
      socket.join(room._id.toString());
    });
    socket.emit('rooms:joined', rooms.map((room) => room._id.toString()));
  };

  socket.on('connect_error', (err) => {
    console.error('Socket connection error', err);
  });

  socket.on('chat:message', async (payload, ack) => {
    try {
      const { roomId, content, messageType = 'text', fileMeta } = payload;

      if (!roomId) {
        throw new Error('roomId is required');
      }

      const room = await Room.findById(roomId);
      if (
        !room ||
        !room.participants.some((participant) => participant.toString() === userId)
      ) {
        throw new Error('You are not part of this room');
      }

      const allowedTypes = ['text', 'image', 'file'];

      const message = await Message.create({
        room: roomId,
        sender: userId,
        content: content || '',
        messageType: allowedTypes.includes(messageType) ? messageType : 'text',
        fileMeta: fileMeta || undefined,
        deliveredTo: [userId],
        readBy: [userId],
      });

      const populatedMessage = await message.populate('sender', 'username avatarColor favoriteDrink');

      await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

      io.to(roomId).emit('chat:new_message', {
        ...populatedMessage.toObject(),
      });

      const otherParticipants = room.participants
        .map((participant) => participant.toString())
        .filter((participant) => participant !== userId);

      otherParticipants.forEach((participantId) => {
        if (onlineUsers.has(participantId)) {
          io.to(onlineUsers.get(participantId)).emit('notifications:new', {
            roomId,
            messageId: message._id.toString(),
            fromUserId: userId,
            content: message.content,
            createdAt: message.createdAt,
          });
        }
      });

      if (ack) {
        ack({ status: 'ok', messageId: message._id });
      }
    } catch (error) {
      if (ack) {
        ack({ status: 'error', message: error.message });
      }
    }
  });

  socket.on('chat:delivered', async ({ messageId }) => {
    if (!messageId) return;
    const message = await Message.findById(messageId);
    if (!message) return;
    const room = await Room.findById(message.room);
    if (
      !room ||
      !room.participants.some((participant) => participant.toString() === userId)
    ) {
      return;
    }
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deliveredTo: userId },
    });
  });

  socket.on('chat:read', async ({ messageIds, roomId }) => {
    if (!messageIds || !Array.isArray(messageIds)) {
      return;
    }
    const room = await Room.findById(roomId);
    if (
      !room ||
      !room.participants.some((participant) => participant.toString() === userId)
    ) {
      return;
    }
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: userId } }
    );
    io.to(roomId).emit('chat:read_receipt', {
      roomId,
      readerId: userId,
      messageIds,
    });
  });

  socket.on('chat:reaction', async ({ messageId, emoji }, ack) => {
    try {
      if (!messageId || !emoji) {
        throw new Error('messageId and emoji are required');
      }

      const message = await Message.findByIdAndUpdate(
        messageId,
        {
          $pull: { reactions: { user: userId } },
        },
        { new: true }
      );

      if (!message) {
        throw new Error('Message not found');
      }

      const room = await Room.findById(message.room);
      if (
        !room ||
        !room.participants.some((participant) => participant.toString() === userId)
      ) {
        throw new Error('You are not part of this conversation');
      }

      message.reactions.push({ emoji, user: userId });
      await message.save();
      await message.populate('sender', 'username avatarColor favoriteDrink');
      await message.populate('reactions.user', 'username avatarColor');

      io.to(message.room.toString()).emit('chat:reaction', {
        messageId,
        reactions: message.reactions.map((reaction) => ({
          emoji: reaction.emoji,
          user: {
            _id: reaction.user._id,
            username: reaction.user.username,
            avatarColor: reaction.user.avatarColor,
          },
        })),
      });

      if (ack) {
        ack({ status: 'ok' });
      }
    } catch (error) {
      if (ack) {
        ack({ status: 'error', message: error.message });
      }
    }
  });

  socket.on('typing:start', ({ roomId }) => {
    ACTIVE_TYPERS.set(`${roomId}:${userId}`, {
      roomId,
      userId,
      username: socket.user.username,
    });
    emitTypingUsers(io, roomId);
  });

  socket.on('typing:stop', ({ roomId }) => {
    ACTIVE_TYPERS.delete(`${roomId}:${userId}`);
    emitTypingUsers(io, roomId);
  });

  socket.on('disconnect', async () => {
    ACTIVE_TYPERS.forEach((value, key) => {
      if (value.userId === userId) {
        ACTIVE_TYPERS.delete(key);
      }
    });

    await notifyPresence(false);
    onlineUsers.delete(userId);
  });

  const initialize = async () => {
    onlineUsers.set(userId, socket.id);
    await notifyPresence(true);
    await joinUserRooms();
  };

  initialize().catch((error) => {
    console.error('Error initializing socket connection', error);
  });
};

module.exports = registerChatHandlers;

