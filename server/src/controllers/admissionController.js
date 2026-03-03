const Admission = require('../models/Admission');
const Section = require('../models/Section');
const Inquiry = require('../models/Inquiry');

// @desc    Get all admissions
// @route   GET /api/admissions
// @access  Private
exports.getAdmissions = async (req, res) => {
    try {
        const admissions = await Admission.find()
            .populate('classId', 'name')
            .populate('sectionId', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(admissions);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Update admission details (filling the draft)
// @route   PATCH /api/admissions/:id
// @access  Private
exports.updateAdmission = async (req, res) => {
    try {
        const admission = await Admission.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('classId', 'name').populate('sectionId', 'name');

        if (!admission) return res.status(404).json({ message: 'Admission not found' });

        res.status(200).json(admission);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Finalize admission (Admit student)
// @route   POST /api/admissions/:id/finalize
// @access  Private
exports.finalizeAdmission = async (req, res) => {
    try {
        const admission = await Admission.findById(req.params.id);
        if (!admission) return res.status(404).json({ message: 'Admission not found' });

        if (admission.status === 'admitted') {
            return res.status(400).json({ message: 'Student is already admitted' });
        }

        if (!admission.sectionId) {
            return res.status(400).json({ message: 'Please assign a section before finalizing' });
        }

        // 1. Check Section Capacity
        const section = await Section.findById(admission.sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        if (section.capacity <= 0) {
            return res.status(400).json({ message: 'Section is at full capacity' });
        }

        // 2. Generate Student ID (Simple format: FL-YYYY-count)
        const year = new Date().getFullYear();
        const count = await Admission.countDocuments({ status: 'admitted' });
        const studentId = `FL-${year}-${(count + 1).toString().padStart(3, '0')}`;

        // 3. Update Admission
        admission.status = 'admitted';
        admission.studentId = studentId;
        admission.admittedAt = new Date();
        await admission.save();

        // 4. Decrement Section Capacity
        section.capacity = section.capacity - 1;
        await section.save();

        // 5. Update linked Inquiry status to 'converted'
        await Inquiry.findOneAndUpdate(
            { linkedAdmissionId: admission._id },
            { status: 'converted' }
        );

        const updatedAdmission = await Admission.findById(admission._id)
            .populate('classId', 'name')
            .populate('sectionId', 'name');

        res.status(200).json(updatedAdmission);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Delete admission
// @route   DELETE /api/admissions/:id
// @access  Private/Admin
exports.deleteAdmission = async (req, res) => {
    try {
        const admission = await Admission.findById(req.params.id);
        if (!admission) return res.status(404).json({ message: 'Admission not found' });

        // If it was admitted, we should ideally increment capacity back
        if (admission.status === 'admitted' && admission.sectionId) {
            await Section.findByIdAndUpdate(admission.sectionId, { $inc: { capacity: 1 } });
        }

        await Admission.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Admission record deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
