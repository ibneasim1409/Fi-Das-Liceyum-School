const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        index: true
    },
    linkedStudentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admission',
        sparse: true
    },
    linkedInquiryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inquiry',
        sparse: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    unreadCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Conversation', conversationSchema);
