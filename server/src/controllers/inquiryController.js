const Inquiry = require('../models/Inquiry');
const Admission = require('../models/Admission');
const Class = require('../models/Class');

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private
exports.getInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().populate('classId', 'name').sort({ createdAt: -1 });
        res.status(200).json(inquiries);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Create new inquiry
// @route   POST /api/inquiries
// @access  Private
exports.createInquiry = async (req, res) => {
    const { parentName, studentName, phoneNumber, classId, notes } = req.body;

    try {
        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const inquiry = new Inquiry({
            parentName,
            studentName,
            phoneNumber,
            classId,
            notes,
            status: 'new'
        });

        await inquiry.save();

        res.status(201).json({ inquiry });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Update inquiry status
// @route   PATCH /api/inquiries/:id
// @access  Private
exports.updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const inquiry = await Inquiry.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('classId', 'name');

        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

        res.status(200).json(inquiry);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
