const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index:true
        },
        videoUrl: {
            type: String,
            required: true
        },
        videoId: {
            type: String,
            required: true,
            index: true
        },
        title: {
            type: String,
            default: "Untitled Chat"
        }
    },
    {
        timestamps: true
    }
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
