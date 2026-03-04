const FeeStructure = require('../models/FeeStructure');

// Create a new Fee Structure
exports.createFeeStructure = async (req, res) => {
    try {
        const feeStructure = await FeeStructure.create(req.body);
        res.status(201).json(feeStructure);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all Fee Structures (with filter)
exports.getFeeStructures = async (req, res) => {
    try {
        const { classId, sessionId } = req.query;
        let query = {};
        if (classId) query.classId = classId;
        if (sessionId) query.sessionId = sessionId;

        const feeStructures = await FeeStructure.find(query).populate('classId', 'name');
        res.json(feeStructures);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update a Fee Structure
exports.updateFeeStructure = async (req, res) => {
    try {
        const feeStructure = await FeeStructure.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!feeStructure) return res.status(404).json({ message: 'Fee Structure not found' });
        res.json(feeStructure);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a Fee Structure
exports.deleteFeeStructure = async (req, res) => {
    try {
        const feeStructure = await FeeStructure.findByIdAndDelete(req.params.id);
        if (!feeStructure) return res.status(404).json({ message: 'Fee Structure not found' });
        res.json({ message: 'Fee Structure deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
