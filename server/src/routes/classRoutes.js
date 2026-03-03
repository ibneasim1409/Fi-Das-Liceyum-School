const express = require('express');
const router = express.Router();
const {
    createClass,
    getClasses,
    updateClass,
    deleteClass,
    addSection,
    deleteSection
} = require('../controllers/classController');
const { auth, authorize } = require('../middlewares/auth');

// All routes are protected
router.use(auth);

// GET all classes (available to all authenticated users)
router.get('/', getClasses);

// Restricted to admin and hr
router.post('/', authorize('admin', 'hr'), createClass);
router.patch('/:id', authorize('admin', 'hr'), updateClass);
router.delete('/:id', authorize('admin', 'hr'), deleteClass);

// Section routes
router.post('/:classId/sections', authorize('admin', 'hr'), addSection);
router.delete('/sections/:id', authorize('admin', 'hr'), deleteSection);

module.exports = router;
