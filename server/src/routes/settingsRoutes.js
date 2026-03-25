const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, authorize } = require('../middlewares/auth');

router.get('/school', settingsController.getSchoolIdentity); // Publicly accessible branding
router.get('/', auth, settingsController.getSettings);
router.put('/whatsapp', auth, authorize('admin'), settingsController.updateWhatsAppSettings);
router.put('/sms', auth, authorize('admin'), settingsController.updateSMSSettings);
router.put('/billing', auth, authorize('admin'), settingsController.updateBillingSettings);

module.exports = router;
