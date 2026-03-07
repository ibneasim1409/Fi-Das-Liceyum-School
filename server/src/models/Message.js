const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: String, // 'school' or 'parent'
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    hasMedia: {
        type: Boolean,
        default: false
    },
    mediaType: {
        type: String, // 'image', 'document', 'video', 'audio'
        required: false
    },
    mediaUrl: {
        type: String,
        required: false
    },
    channel: {
        type: String,
        enum: ['whatsapp', 'sms'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
        default: 'pending'
    },
    externalId: String, // To store message ID from WA/SMS Gateway
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
