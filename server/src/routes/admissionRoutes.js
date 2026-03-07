const express = require('express');
const router = express.Router();
const {
    getAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    finalizeAdmission,
    deleteAdmission,
    checkSiblings,
    uploadImage
} = require('../controllers/admissionController');
const { auth, authorize } = require('../middlewares/auth');

router.use(auth);

router.get('/', getAdmissions);
router.get('/:id', getAdmissionById);
router.post('/', createAdmission);
router.get('/check-siblings/:cnic', checkSiblings);
router.patch('/:id', updateAdmission);
router.post('/:id/finalize', finalizeAdmission);
router.post('/upload-image', uploadImage);
router.delete('/:id', authorize('admin'), deleteAdmission);

module.exports = router;
