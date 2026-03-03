const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Class name is required'],
        unique: true,
        trim: true
    },
    baseFee: {
        type: Number,
        required: [true, 'Base fee is required'],
        min: [0, 'Fee cannot be negative']
    },
    sections: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Section'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Class', classSchema);
