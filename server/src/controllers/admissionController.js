const Admission = require('../models/Admission');
const Section = require('../models/Section');
const Inquiry = require('../models/Inquiry');
const Challan = require('../models/Challan');
const multer = require('multer');
const path = require('path');

const fs = require('fs');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'student_pictures');
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `student-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
    }
}).single('studentPicture');

// @desc    Create a new admission draft
// @route   POST /api/admissions
// @access  Private
exports.createAdmission = async (req, res) => {
    try {
        const { linkedInquiryId, ...admissionData } = req.body;

        // Robustness: Handle classId if it's an object (happens with pre-filled inquiries)
        if (admissionData.classId && typeof admissionData.classId === 'object') {
            admissionData.classId = admissionData.classId._id;
        }

        // Robustness: Remove empty strings for ObjectId fields to prevent casting errors
        if (admissionData.sectionId === '') delete admissionData.sectionId;
        if (admissionData.classId === '') delete admissionData.classId;

        const admission = new Admission(admissionData);
        await admission.save();

        // If this came from an inquiry, link it
        if (linkedInquiryId && linkedInquiryId !== '') {
            await Inquiry.findByIdAndUpdate(linkedInquiryId, {
                linkedAdmissionId: admission._id
            });
        }

        const populated = await Admission.findById(admission._id)
            .populate('classId', 'name')
            .populate('sectionId', 'name');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Create Admission Error:', err);
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
};

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
        const updateData = { ...req.body };

        // Robustness: Handle classId if it's an object
        if (updateData.classId && typeof updateData.classId === 'object') {
            updateData.classId = updateData.classId._id;
        }

        // Robustness: Remove empty strings for ObjectId fields to prevent casting errors
        if (updateData.sectionId === '') updateData.sectionId = undefined;
        if (updateData.classId === '') delete updateData.classId;

        const currentAdmission = await Admission.findById(req.params.id);
        if (!currentAdmission) return res.status(404).json({ message: 'Admission not found' });

        // Protection: If admitted, don't allow changing status, studentId, or classId
        if (currentAdmission.status === 'admitted') {
            delete updateData.status;
            delete updateData.studentId;
            delete updateData.classId;
            // Also don't allow changing section once admitted as it affects capacity
            delete updateData.sectionId;
        }

        const admission = await Admission.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('classId', 'name').populate('sectionId', 'name');

        res.status(200).json(admission);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Step 1: Process Admission (Issue Bill)
// @route   POST /api/admissions/:id/finalize
// @access  Private
exports.finalizeAdmission = async (req, res) => {
    try {
        const admission = await Admission.findById(req.params.id);
        if (!admission) return res.status(404).json({ message: 'Admission record not found' });

        if (admission.status === 'admitted' || admission.status === 'pending_admission') {
            return res.status(400).json({ message: `Student is already in ${admission.status} state` });
        }

        if (!admission.sectionId) {
            return res.status(400).json({ message: 'Please assign a section before processing' });
        }

        // 1. Check Section Capacity (Pre-check)
        const section = await Section.findById(admission.sectionId);
        if (!section) return res.status(404).json({ message: 'Section not found' });

        if (section.capacity <= 0) {
            return res.status(400).json({ message: 'Section is at full capacity' });
        }

        // 2. Lock status to pending
        admission.status = 'pending_admission';
        await admission.save();

        // 3. Generate Admission Challan
        try {
            const challanCount = await Challan.countDocuments();
            const challanNumber = `CHL-${new Date().getFullYear()}-${(challanCount + 1).toString().padStart(5, '0')}`;

            const now = new Date();
            let billingDate = new Date();
            // If admitted after the 25th, bill for the next month to be fair
            if (now.getDate() > 25) {
                billingDate.setMonth(now.getMonth() + 1);
            }
            const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(billingDate);

            const admissionChallan = new Challan({
                challanNumber,
                admissionId: admission._id,
                studentId: 'PENDING', // Temporary until paid
                studentName: admission.studentName,
                classId: admission.classId,
                type: 'admission',
                month: monthLabel,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                fees: {
                    tuitionFee: admission.feeSnapshot?.tuitionFee || 0,
                    admissionFee: admission.feeSnapshot?.admissionFee || 0,
                    securityDeposit: admission.feeSnapshot?.securityDeposit || 0,
                    discount: admission.discount || 0,
                    otherFees: admission.feeSnapshot?.otherFees || []
                }
            });
            await admissionChallan.save();
        } catch (chlErr) {
            // Rollback status if challan fails
            admission.status = 'draft';
            await admission.save();
            console.error('Failed to generate Admission Challan:', chlErr);
            throw new Error(`Bill generation failed: ${chlErr.message}. Student reverted to draft.`);
        }

        const updatedAdmission = await Admission.findById(admission._id)
            .populate('classId', 'name')
            .populate('sectionId', 'name');

        res.status(200).json(updatedAdmission);
    } catch (err) {
        console.error('Processing Error Details:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
};

/**
 * Internal Helper: Stage 2 - Final Enrollment (Triggered on Payment)
 * Not a route, called by challanController
 */
exports.completeEnrollment = async (admissionId) => {
    try {
        const admission = await Admission.findById(admissionId);
        if (!admission || admission.status !== 'pending_admission') {
            console.log(`Bypassing auto-enroll: Admission ${admissionId} is either not found or not in pending state.`);
            return;
        }

        // 1. Check Section Capacity again (Crucial for race conditions)
        const section = await Section.findById(admission.sectionId);
        if (!section || section.capacity <= 0) {
            throw new Error(`Cannot complete enrollment: Section ${section?.name || 'Unknown'} is now full.`);
        }

        // 2. Generate Student ID (Collision-resistant)
        const year = new Date().getFullYear();
        let studentId;
        let isUnique = false;
        let count = await Admission.countDocuments({ status: 'admitted' });
        let nextNum = count + 1;

        while (!isUnique) {
            studentId = `FL-${year}-${nextNum.toString().padStart(3, '0')}`;
            const existing = await Admission.findOne({ studentId });
            if (!existing) {
                isUnique = true;
            } else {
                nextNum++;
            }
        }

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

        // 6. Update the Challan itself to reflect the new Student ID
        await Challan.updateMany(
            { admissionId: admission._id },
            { studentId: studentId }
        );

        console.log(`Enrollment completed successfully for student: ${studentId}`);
    } catch (err) {
        console.error('CRITICAL: Failed to complete enrollment on payment:', err);
        // In a real system, this would trigger an alert to the admin
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

// @desc    Check sibling count by parent CNIC
// @route   GET /api/admissions/check-siblings/:cnic
// @access  Private
exports.checkSiblings = async (req, res) => {
    try {
        const { cnic } = req.params;
        const currentStudentId = req.query.excludeId; // To not count the current student if editing

        let query = {
            parentCNIC: cnic,
            status: 'admitted'
        };

        if (currentStudentId) {
            query._id = { $ne: currentStudentId };
        }

        const count = await Admission.countDocuments(query);
        res.status(200).json({ siblingCount: count });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Upload student picture
// @route   POST /api/admissions/upload-image
// @access  Private
exports.uploadImage = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }
        // Return the relative path for database storage
        const filePath = `/uploads/student_pictures/${req.file.filename}`;
        res.status(200).json({ imageUrl: filePath });
    });
};
