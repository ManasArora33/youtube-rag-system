const mongoose = require("mongoose");
const sourceSchema = new mongoose.Schema(
    {
        text: String,
        timestamp: String
    },
    {
        _id: false
    }
);

const messageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true
        },
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        sources: [sourceSchema]
    },
    {
        timestamps: true
    }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
