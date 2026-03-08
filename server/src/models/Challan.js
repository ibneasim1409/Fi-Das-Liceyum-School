const mongoose = require('mongoose');

const challanSchema = new mongoose.Schema({
    challanNumber: {
        type: String,
        required: true,
        unique: true
    },
    admissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admission',
        required: true
    },
    studentId: String, // Copied for convenience
    studentName: String,
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    type: {
        type: String,
        enum: ['admission', 'monthly', 'other'],
        required: true
    },
    month: {
        type: String, // e.g. "March 2024"
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    fees: {
        tuitionFee: { type: Number, default: 0 },
        admissionFee: { type: Number, default: 0 },
        securityDeposit: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        otherFees: [{
            label: String,
            amount: Number
        }]
    },
    totalAmount: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'partially_paid', 'void', 'overdue'],
        default: 'pending'
    },
    paidAt: Date,
    paymentMethod: String,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {} // Used by Cron engine for 'appliedEarlyBird', 'voidReason', etc.
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate total before saving
challanSchema.pre('save', async function () {
    const tuition = this.fees.tuitionFee || 0;
    const admission = this.fees.admissionFee || 0;
    const security = this.fees.securityDeposit || 0;
    const discount = this.fees.discount || 0;

    // Safely reduce other fees, ensuring each amount is a number
    const other = this.fees.otherFees?.reduce((acc, f) => acc + (Number(f.amount) || 0), 0) || 0;

    this.totalAmount = tuition + admission + security + other - discount;
});

module.exports = mongoose.model('Challan', challanSchema);
