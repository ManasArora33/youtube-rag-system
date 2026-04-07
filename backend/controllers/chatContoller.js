const Chat = require('../models/Chat');
const axios = require('axios');

const extractVideoId = (url) => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes("youtu.be")) {
            return urlObj.pathname.slice(1).split('?')[0];
        }
        return urlObj.searchParams.get('v');
    } catch (error) {
        return null;
    }
}

const extractVideoTitle = async (videoUrl) => {
    try {
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
        return response.data.title;
    } catch (error) {
        console.error("Error fetching video title:", error.message);
        return 'New Chat';
    }
}

const createChat = async (req, res) => {
    try {
        const { videoUrl } = req.body;
        const userId = req.user.userId;
        if (!videoUrl) {
            return res.status(400).json({ message: 'Video URL is required' });
        }
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            return res.status(400).json({ message: 'Invalid YouTube URL' });
        }

        // 1. Create chat with 'processing' status and return immediately
        const videoTitle = await extractVideoTitle(videoUrl);
        const chat = await Chat.create({
            userId,
            videoUrl,
            videoId,
            title: videoTitle || 'New Chat',
            status: 'processing'
        });

        // 2. Start ingestion in the background
        (async () => {
            console.log(`[Background] Starting ingestion for chat ${chat._id}`);
            try {
                // Large timeout (5 mins) to handle cold starts
                await axios.post(`${process.env.PYTHON_SERVICE_URL}/ingest`, { videoUrl }, { timeout: 300000 });
                await Chat.findByIdAndUpdate(chat._id, { status: 'ready' });
                console.log(`[Background] Ingestion successful for chat ${chat._id}`);
            } catch (error) {
                console.error(`[Background] Ingestion failed for chat ${chat._id}:`, error.message);
                // We keep it as 'processing' or could set to 'failed'. 
                // For simplicity, we'll let it stay 'processing'.
            }
        })();

        res.status(201).json({ chat });
    } catch (error) {
        console.error("API Error - CreateChat:", error.message);
        res.status(500).json({ message: "An internal error occurred", error: error.message });
    }
}

const getChatStatus = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat.findById(chatId).select('status');
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json({ status: chat.status || 'ready' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
        return res.status(200).json(chats);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const renameChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { title } = req.body;
        const userId = req.user.userId;

        if (!title || title.trim() === '') {
            return res.status(400).json({ message: 'Title is required' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (chat.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        chat.title = title.trim();
        await chat.save();

        res.json({ chat });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (chat.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await chat.deleteOne();

        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createChat, getChats, renameChat, deleteChat, getChatStatus };