const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const axios = require('axios');

// Helper to wait for a specific time
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

        const messages = await Message.find({ chatId })
            .sort({ createdAt: -1 })
            .limit(10);
        const history = messages
            .reverse()
            .map(m => `${m.role}: ${m.content}`)
            .join("\n");

        const userMessage = await Message.create({
            chatId,
            role: "user",
            content,
        });

        // 1. Logic for Cold-Start Retries
        let aiResponse;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                console.log(`[Query] Attempting AI call (Attempt ${attempts + 1})...`);
                aiResponse = await axios.post(`${process.env.PYTHON_SERVICE_URL}/query`, {
                    videoId: chat.videoId,
                    question: content,
                    history: history,
                }, { timeout: 300000 });
                break; // Success!
            } catch (error) {
                attempts++;
                // If it's a connection error or gateway error, it's likely a cold start
                const isRetryable = !error.response || [502, 503, 504, 500].includes(error.response.status);
                
                if (isRetryable && attempts < maxAttempts) {
                    console.log(`[Query] Python service is likely waking up... Retrying in 5s.`);
                    await sleep(5000);
                } else {
                    console.error("DEBUG - SendMessage AI Error:", error.message);
                    return res.status(500).json({ 
                        message: "AI Query failed after multiple attempts. Service might be down.", 
                        error: error.message,
                        details: error.response?.data || "No additional details"
                    });
                }
            }
        }

        // 2. Save assistant response
        const assistantMessage = await Message.create({
            chatId,
            role: "assistant",
            content: aiResponse.data.answer,
            sources: [],
        });

        chat.updatedAt = new Date();
        await chat.save();

        res.json({
            userMessage,
            assistantMessage,
        });
    } catch (error) {
        console.error("DEBUG - SendMessage Controller Error:", error.message);
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
