const express = require('express');
const router = express.Router();
const { sendMessage, getChatMessages } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

router.post('/:chatId', authMiddleware, rateLimitMiddleware, sendMessage);
router.get('/:chatId', authMiddleware, getChatMessages);

module.exports = router;