const Admission = require('../models/Admission');
const Inquiry = require('../models/Inquiry');
const Challan = require('../models/Challan');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const [
            activeStudents,
            totalInquiries,
            convertedInquiries,
            pendingAdmissions,
            financials
        ] = await Promise.all([
            Admission.countDocuments({ status: 'admitted' }),
            Inquiry.countDocuments(),
            Inquiry.countDocuments({
                status: 'converted',
                linkedAdmissionId: { $ne: null }
            }),
            Admission.countDocuments({ status: 'pending_admission' }),
            Challan.aggregate([
                {
                    $group: {
                        _id: null,
                        paidTotal: {
                            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] }
                        },
                        unpaidTotal: {
                            $sum: { $cond: [{ $in: ['$status', ['pending', 'overdue']] }, '$totalAmount', 0] }
                        }
                    }
                }
            ])
        ]);

        const totalCollection = financials.length > 0 ? financials[0].paidTotal : 0;
        const outstandingDues = financials.length > 0 ? financials[0].unpaidTotal : 0;

        // Calculate Conversion Rate: (Converted Inquiries / Total Inquiries) * 100
        const conversionRate = totalInquiries > 0
            ? Math.round((convertedInquiries / totalInquiries) * 100)
            : 0;

        res.status(200).json({
            activeStudents,
            totalInquiries,
            pendingAdmissions,
            totalCollection,
            outstandingDues,
            conversionRate
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
