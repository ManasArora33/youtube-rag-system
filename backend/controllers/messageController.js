const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const axios = require('axios');

const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(400).json({ message: 'Chat not found' });
        }
        if (chat.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        // get conversation message history
        const messages = await Message.find({ chatId })
            .sort({ createdAt: -1 })
            .limit(10);
        const history = messages
            .reverse()
            .map(m => `${m.role}: ${m.content}`)
            .join("\n");

        // save user message
        const userMessage = await Message.create({
            chatId,
            role: "user",
            content,
        });

        // dummy AI response (temporary)
        const aiResponse = await axios.post(`${process.env.PYTHON_SERVICE_URL}/query`, {
            videoId: chat.videoId,
            question: content,
            history: history,
        });

        const assistantMessage = await Message.create({
            chatId,
            role: "assistant",
            content: aiResponse.data.answer,
            sources: [],
        });

        // update chat activity
        chat.updatedAt = new Date();
        await chat.save();

        res.json({
            userMessage,
            assistantMessage,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(400).json({ message: 'Chat not found' });
        }
        if (chat.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    sendMessage,
    getChatMessages
};
