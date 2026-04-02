const express = require('express');
const router = express.Router();
const { createChat, getChats, renameChat, deleteChat, getChatStatus } = require('../controllers/chatContoller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createChat);
router.get('/all', authMiddleware, getChats);
router.get('/:chatId/status', authMiddleware, getChatStatus);
router.patch('/:chatId', authMiddleware, renameChat);
router.delete('/:chatId', authMiddleware, deleteChat);
module.exports = router;

