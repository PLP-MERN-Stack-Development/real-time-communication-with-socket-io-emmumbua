const express = require('express');
const { getRooms, createRoom, getOrCreateDirectRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getRooms);
router.post('/', protect, createRoom);
router.post('/direct', protect, getOrCreateDirectRoom);

module.exports = router;

