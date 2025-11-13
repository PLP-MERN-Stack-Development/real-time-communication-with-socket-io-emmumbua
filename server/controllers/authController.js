const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const COFFEE_COLORS = [
  '#362415',
  '#6F4E37',
  '#C3986B',
  '#C67C4E',
  '#8D5524',
  '#A47148',
  '#D3B58F',
  '#4B3621',
  '#B87333',
];

const pickRandomColor = () => {
  return COFFEE_COLORS[Math.floor(Math.random() * COFFEE_COLORS.length)];
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, favoriteDrink } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with that email or username');
  }

  const user = await User.create({
    username,
    email,
    password,
    favoriteDrink: favoriteDrink || 'House Blend',
    avatarColor: pickRandomColor(),
  });

  res.status(201).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    favoriteDrink: user.favoriteDrink,
    avatarColor: user.avatarColor,
    statusMessage: user.statusMessage,
    token: generateToken(user._id),
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      favoriteDrink: user.favoriteDrink,
      avatarColor: user.avatarColor,
      statusMessage: user.statusMessage,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

