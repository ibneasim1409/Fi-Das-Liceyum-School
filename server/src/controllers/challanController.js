const Challan = require('../models/Challan');
const Admission = require('../models/Admission');
const Class = require('../models/Class');
const { completeEnrollment } = require('./admissionController');

// @desc    Get all challans
// @route   GET /api/challans
// @access  Private
exports.getChallans = async (req, res) => {
    try {
        const challans = await Challan.find()
            .populate('classId', 'name')
            .populate('admissionId', 'studentName parentName')
            .sort({ createdAt: -1 });
        res.status(200).json(challans);
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
};

// @desc    Get single challan
// @route   GET /api/challans/:id
// @access  Private
exports.getChallan = async (req, res) => {
    try {
        const challan = await Challan.findById(req.params.id)
            .populate('classId', 'name')
            .populate('admissionId', 'studentName parentName phoneNumber address studentId');
        if (!challan) return res.status(404).json({ message: 'Challan not found' });
        res.status(200).json(challan);
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
};

// @desc    Get latest challan for an admission
// @route   GET /api/challans/admission/:admissionId
// @access  Private
exports.getAdmissionChallan = async (req, res) => {
    try {
        let challan = await Challan.findOne({ admissionId: req.params.admissionId, type: 'admission' })
            .sort({ createdAt: -1 });

        if (!challan) {
            // Check if student is admitted; if so, generate missing challan
            const admission = await Admission.findById(req.params.admissionId);
            if (admission && (admission.status === 'admitted' || admission.status === 'pending_admission')) {
                const challanCount = await Challan.countDocuments();
                const challanNumber = `CHL-${new Date().getFullYear()}-${(challanCount + 1).toString().padStart(5, '0')}`;

                challan = new Challan({
                    challanNumber,
                    admissionId: admission._id,
                    studentId: admission.studentId || 'PENDING',
                    studentName: admission.studentName,
                    classId: admission.classId,
                    type: 'admission',
                    month: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    fees: {
                        tuitionFee: admission.feeSnapshot?.tuitionFee || 0,
                        admissionFee: admission.feeSnapshot?.admissionFee || 0,
                        securityDeposit: admission.feeSnapshot?.securityDeposit || 0,
                        discount: admission.discount || 0,
                        otherFees: admission.feeSnapshot?.otherFees || []
                    }
                });
                await challan.save();
            } else if (!admission) {
                return res.status(404).json({ message: `Admission record with ID ${req.params.admissionId} not found in database.` });
            } else {
                return res.status(404).json({ message: `Student found but status is '${admission.status}' instead of 'admitted'. Please process admission first.` });
            }
        }
        res.status(200).json(challan);
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
};

// @desc    Update challan status (e.g. mark as paid)
// @route   PATCH /api/challans/:id
// @access  Private
exports.updateChallan = async (req, res) => {
    try {
        const { status, paymentMethod, paidAt } = req.body;
        const currentChallan = await Challan.findById(req.params.id);
        if (!currentChallan) return res.status(404).json({ message: 'Challan not found' });

        if (currentChallan.status === 'void') {
            return res.status(400).json({ message: 'Cannot update a voided challan' });
        }

        const challan = await Challan.findByIdAndUpdate(
            req.params.id,
            { status, paymentMethod, paidAt: status === 'paid' ? (paidAt || new Date()) : undefined },
            { new: true }
        );

        // If an admission challan is marked as 'paid', trigger auto-enrollment
        if (status === 'paid' && challan.type === 'admission') {
            await completeEnrollment(challan.admissionId);
            // Refresh challan and admission to get newest data
            const finalizedChallan = await Challan.findById(req.params.id);
            const admission = await Admission.findById(challan.admissionId);

            return res.status(200).json({
                ...finalizedChallan.toObject(),
                enrollmentCompleted: true,
                studentId: admission?.studentId
            });
        }

        res.status(200).json(challan);
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
};
// @desc    Generate monthly challans for all admitted students
// @route   POST /api/challans/generate-monthly
// @access  Private (Admin/HR)
exports.generateMonthlyChallans = async (req, res) => {
    try {
        const { month } = req.body; // e.g. "April 2024"
        if (!month) return res.status(400).json({ message: 'Month is required' });

        // 1. Get all admitted students
        const students = await Admission.find({ status: 'admitted' });

        let generatedCount = 0;
        let skippedCount = 0;

        for (const student of students) {
            // 2. Check if ANY non-void challan (monthly or admission) already exists for this student and month
            const existing = await Challan.findOne({
                studentId: student.studentId,
                month,
                status: { $ne: 'void' }
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            // 3. Generate Challan
            const challanCount = await Challan.countDocuments();
            const challanNumber = `CHL-M-${new Date().getFullYear()}-${(challanCount + 1).toString().padStart(5, '0')}`;

            const challan = new Challan({
                challanNumber,
                admissionId: student._id,
                studentId: student.studentId,
                studentName: student.studentName,
                classId: student.classId,
                type: 'monthly',
                month,
                dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Default 10 days
                fees: {
                    tuitionFee: student.feeSnapshot?.tuitionFee || 0,
                    discount: student.discount || 0,
                    otherFees: [] // Monthly usually just tuition
                }
            });

            await challan.save();
            generatedCount++;
        }

        res.status(200).json({
            message: 'Monthly generation complete',
            generatedCount,
            skippedCount
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// @desc    Void all pending challans for a specific month
// @route   POST /api/challans/void-batch
// @access  Private (Admin)
exports.voidBatch = async (req, res) => {
    try {
        const { month, type } = req.body;
        if (!month) return res.status(400).json({ message: 'Month is required' });

        const result = await Challan.updateMany(
            { month, type: type || 'monthly', status: 'pending' },
            { status: 'void' }
        );

        res.status(200).json({
            message: `Successfully voided ${result.modifiedCount} pending challans for ${month}`,
            count: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
