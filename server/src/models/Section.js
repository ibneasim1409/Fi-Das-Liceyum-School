const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Section name is required'],
        trim: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    capacity: {
        type: Number,
        default: 40
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure unique section names within a single class
sectionSchema.index({ name: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
