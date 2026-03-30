const express = require('express');
const router = express.Router();
const { createChat, getChats, renameChat, deleteChat } = require('../controllers/chatContoller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createChat);
router.get('/all', authMiddleware, getChats);
router.patch('/:chatId', authMiddleware, renameChat);
router.delete('/:chatId', authMiddleware, deleteChat);
module.exports = router;

