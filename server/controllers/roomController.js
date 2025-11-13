const asyncHandler = require('express-async-handler');
const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Fetch rooms for current user
// @route   GET /api/rooms
// @access  Private
const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({
    participants: req.user._id,
  })
    .populate('participants', 'username avatarColor favoriteDrink isOnline lastSeen')
    .populate('lastMessage');

  res.json(rooms);
});

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
const createRoom = asyncHandler(async (req, res) => {
  const { name, description, participants } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Room name is required');
  }

  const uniqueParticipants = new Set(participants || []);
  uniqueParticipants.add(req.user._id.toString());

  const room = await Room.create({
    name,
    description: description || '',
    participants: Array.from(uniqueParticipants),
    createdBy: req.user._id,
    avatarEmoji: '🫘',
  });

  const populatedRoom = await room.populate('participants', 'username avatarColor favoriteDrink isOnline lastSeen');

  res.status(201).json(populatedRoom);
});

// @desc    Create or fetch direct room between two users
// @route   POST /api/rooms/direct
// @access  Private
const getOrCreateDirectRoom = asyncHandler(async (req, res) => {
  const { otherUserId } = req.body;

  if (!otherUserId) {
    res.status(400);
    throw new Error('otherUserId is required');
  }

  const otherUser = await User.findById(otherUserId);

  if (!otherUser) {
    res.status(404);
    throw new Error('User not found');
  }

  let room = await Room.findOne({
    isDirect: true,
    participants: { $all: [req.user._id, otherUserId], $size: 2 },
  })
    .populate('participants', 'username avatarColor favoriteDrink isOnline lastSeen')
    .populate('lastMessage');

  if (!room) {
    room = await Room.create({
      name: `${req.user.username} & ${otherUser.username}`,
      isDirect: true,
      participants: [req.user._id, otherUserId],
      createdBy: req.user._id,
      avatarEmoji: '🤝',
    });

    room = await room.populate('participants', 'username avatarColor favoriteDrink isOnline lastSeen');
  }

  res.json(room);
});

module.exports = {
  getRooms,
  createRoom,
  getOrCreateDirectRoom,
};

