const express = require('express');
const {
  getMessagesForRoom,
  searchMessages,
  markMessagesRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', protect, searchMessages);
router.get('/:roomId', protect, getMessagesForRoom);
router.post('/read', protect, markMessagesRead);

module.exports = router;

