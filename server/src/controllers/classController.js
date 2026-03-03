const Class = require('../models/Class');
const Section = require('../models/Section');
const Admission = require('../models/Admission');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res) => {
    try {
        const classes = await Class.find().sort({ name: 1 }).populate('sections').lean();

        // Enhance with student counts
        const enhancedClasses = await Promise.all(classes.map(async (cls) => {
            const studentCount = await Admission.countDocuments({ classId: cls._id, status: 'admitted' });

            // Count per section
            const sectionsWithCounts = await Promise.all(cls.sections.map(async (sec) => {
                const secStudentCount = await Admission.countDocuments({ sectionId: sec._id, status: 'admitted' });
                return { ...sec, studentCount: secStudentCount };
            }));

            return { ...cls, studentCount, sections: sectionsWithCounts };
        }));

        res.status(200).json(enhancedClasses);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Admin/HR
exports.createClass = async (req, res) => {
    const { name, baseFee } = req.body;

    try {
        let existingClass = await Class.findOne({ name });
        if (existingClass) {
            return res.status(400).json({ message: 'Class already exists' });
        }

        const newClass = new Class({
            name,
            baseFee
        });

        await newClass.save();
        res.status(201).json(newClass);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Update a class
// @route   PATCH /api/classes/:id
// @access  Private/Admin/HR
exports.updateClass = async (req, res) => {
    try {
        const updatedClass = await Class.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('sections');

        if (!updatedClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.status(200).json(updatedClass);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Delete a class and its sections
// @route   DELETE /api/classes/:id
// @access  Private/Admin/HR
exports.deleteClass = async (req, res) => {
    try {
        const classToDelete = await Class.findById(req.params.id);
        if (!classToDelete) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Delete associated sections
        await Section.deleteMany({ classId: req.params.id });
        await Class.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Class and associated sections deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Add a section to a class
// @route   POST /api/classes/:classId/sections
// @access  Private/Admin/HR
exports.addSection = async (req, res) => {
    const { name, capacity } = req.body;
    const { classId } = req.params;

    try {
        const targetClass = await Class.findById(classId);
        if (!targetClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const existingSection = await Section.findOne({ name, classId });
        if (existingSection) {
            return res.status(400).json({ message: 'Section already exists in this class' });
        }

        const newSection = new Section({
            name,
            classId,
            capacity
        });

        await newSection.save();

        targetClass.sections.push(newSection._id);
        await targetClass.save();

        const updatedClass = await Class.findById(classId).populate('sections');
        res.status(201).json(updatedClass);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Delete a section
// @route   DELETE /api/classes/sections/:id
// @access  Private/Admin/HR
exports.deleteSection = async (req, res) => {
    try {
        const section = await Section.findById(req.params.id);
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        const classId = section.classId;

        await Section.findByIdAndDelete(req.params.id);

        // Remove from Class sections array
        await Class.findByIdAndUpdate(classId, {
            $pull: { sections: req.params.id }
        });

        const updatedClass = await Class.findById(classId).populate('sections');
        res.status(200).json(updatedClass);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
