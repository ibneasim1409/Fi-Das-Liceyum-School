const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Default Plan', 'Referred Plan', 'Scholarship Plan 25%', 'Scholarship Plan 50%'],
        default: 'Default Plan'
    },
    sessionId: {
        type: String,
        required: [true, 'Session period is required'], // e.g. "2024-25"
        trim: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: [true, 'Class reference is required']
    },
    amounts: {
        tuitionFee: {
            type: Number,
            required: true,
            min: 0
        },
        admissionFee: {
            type: Number,
            default: 0,
            min: 0
        },
        securityDeposit: {
            type: Number,
            default: 0,
            min: 0
        },
        otherFees: [{
            label: String,
            amount: Number
        }]
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    effectiveDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
