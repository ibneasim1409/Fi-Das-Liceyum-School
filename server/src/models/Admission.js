const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    studentId: {
        type: String,
        unique: true,
        sparse: true // Allow null for drafts
    },
    parentName: {
        type: String,
        required: true,
        trim: true
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    parentCNIC: {
        type: String,
        trim: true
    },
    studentCNIC: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return v.length <= 11;
            },
            message: props => `Phone number cannot exceed 11 digits!`
        }
    },
    address: {
        type: String,
        trim: true
    },
    guardianInfo: {
        name: String,
        phone: String,
        relation: String
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    siblingDiscountPercentage: {
        type: Number,
        default: 0
    },
    feeStructureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeStructure'
    },
    feeSnapshot: {
        structureName: String,
        tuitionFee: Number,
        admissionFee: Number,
        annualExpenses: Number,
        securityDeposit: Number,
        otherFees: [{
            label: String,
            amount: Number
        }]
    },
    status: {
        type: String,
        enum: ['draft', 'pending_admission', 'admitted', 'withdrawn'],
        default: 'draft'
    },
    admittedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    studentPicture: {
        type: String,
        trim: true
    }
});

// Virtual for final tuition fee calculation
admissionSchema.virtual('netTuitionFee').get(function () {
    const base = this.feeSnapshot?.tuitionFee || 0;
    const discountMultiplier = this.siblingDiscountPercentage / 100;
    return Math.max(0, base - (base * discountMultiplier));
});

// Ensure virtuals are included in JSON
admissionSchema.set('toJSON', { virtuals: true });
admissionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Admission', admissionSchema);
