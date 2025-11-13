const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users except current
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select(
    'username avatarColor favoriteDrink statusMessage isOnline lastSeen'
  );
  res.json(users);
});

module.exports = { getUsers };

