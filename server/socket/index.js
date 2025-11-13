const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const registerChatHandlers = require('./chatHandlers');

const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(','),
      credentials: true,
    },
    pingTimeout: 25000,
    pingInterval: 10000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        throw new Error('Authentication token missing');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }
      socket.user = {
        _id: user._id,
        username: user.username,
      };
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', (socket) => {
    registerChatHandlers({ io, socket, onlineUsers });
  });

  return io;
};

module.exports = initSocket;

