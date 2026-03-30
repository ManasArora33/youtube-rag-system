const Chat = require('../models/Chat');
const axios = require('axios');

const extractVideoId = (url) => {
    try {
        const urlObj = new URL(url);
        // shortened youtube url (e.g. https://youtu.be/VIDEO_ID)
        if (urlObj.hostname.includes("youtu.be")) {
            return urlObj.pathname.slice(1);
        }
        // full youtube url (e.g. https://www.youtube.com/watch?v=VIDEO_ID)
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
        // ingestion
        // TODO: call python service to ingest video 
        let ingestionResult;
        try {
            ingestionResult = await axios.post(`${process.env.PYTHON_SERVICE_URL}/ingest`, {
                videoUrl
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
        const videoTitle = await extractVideoTitle(videoUrl);
        // console.log("Video title:", videoTitle);
        const chat = await Chat.create({
            userId,
            videoUrl,
            videoId,
            title: videoTitle || 'New Chat'
        });
        res.status(201).json({
            chat,
            ingestionResult: ingestionResult.data.message,
            suggestedQuestions: ingestionResult.data.suggestedQuestions || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
        if (chats.length === 0) {
            return res.status(404).json({ message: 'No chats found' });
        }
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

module.exports = { createChat, getChats, renameChat, deleteChat };