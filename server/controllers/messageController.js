const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Room = require('../models/Room');

// @desc    Fetch messages for a room with pagination
// @route   GET /api/messages/:roomId
// @access  Private
const getMessagesForRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { before, limit = 20 } = req.query;

  const room = await Room.findById(roomId);
  if (
    !room ||
    !room.participants.some((participant) => participant.toString() === req.user._id.toString())
  ) {
    res.status(403);
    throw new Error('You do not have access to this room');
  }

  const query = { room: roomId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate('sender', 'username avatarColor favoriteDrink')
    .lean();

  res.json({
    messages: messages.reverse(),
    hasMore: messages.length === Number(limit),
  });
});

// @desc    Search messages for the current user
// @route   GET /api/messages/search
// @access  Private
const searchMessages = asyncHandler(async (req, res) => {
  const { term } = req.query;

  if (!term || term.trim().length < 2) {
    res.status(400);
    throw new Error('Search term must be at least 2 characters long');
  }

  const rooms = await Room.find({ participants: req.user._id }).select('_id');
  const roomIds = rooms.map((room) => room._id);

  const results = await Message.find({
    room: { $in: roomIds },
    content: { $regex: term, $options: 'i' },
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('sender', 'username avatarColor')
    .populate('room', 'name avatarEmoji isDirect participants')
    .lean();

  res.json(results);
});

// @desc    Mark messages as read
// @route   POST /api/messages/read
// @access  Private
const markMessagesRead = asyncHandler(async (req, res) => {
  const { messageIds } = req.body;

  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
    res.status(400);
    throw new Error('messageIds must be a non-empty array');
  }

  const objectIds = messageIds.map((id) => new mongoose.Types.ObjectId(id));

  await Message.updateMany(
    { _id: { $in: objectIds } },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({ success: true });
});

module.exports = {
  getMessagesForRoom,
  searchMessages,
  markMessagesRead,
};

