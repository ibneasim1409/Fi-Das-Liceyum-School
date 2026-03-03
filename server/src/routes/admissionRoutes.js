const express = require('express');
const router = express.Router();
const {
    getAdmissions,
    updateAdmission,
    finalizeAdmission,
    deleteAdmission
} = require('../controllers/admissionController');
const { auth, authorize } = require('../middlewares/auth');

router.use(auth);

router.get('/', getAdmissions);
router.patch('/:id', updateAdmission);
router.post('/:id/finalize', finalizeAdmission);
router.delete('/:id', authorize('admin'), deleteAdmission);

module.exports = router;
