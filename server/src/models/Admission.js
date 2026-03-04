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
    baseFee: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'admitted', 'withdrawn'],
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

// Virtual for final fee calculation
admissionSchema.virtual('finalFee').get(function () {
    return Math.max(0, this.baseFee - this.discount);
});

// Ensure virtuals are included in JSON
admissionSchema.set('toJSON', { virtuals: true });
admissionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Admission', admissionSchema);
