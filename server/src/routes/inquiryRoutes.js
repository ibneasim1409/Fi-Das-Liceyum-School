const express = require('express');
const router = express.Router();
const {
    createInquiry,
    getInquiries,
    updateInquiryStatus
} = require('../controllers/inquiryController');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.get('/', getInquiries);
router.post('/', createInquiry);
router.patch('/:id/status', updateInquiryStatus);

module.exports = router;
