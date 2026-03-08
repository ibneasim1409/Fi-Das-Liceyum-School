const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth } = require('../middlewares/auth');

router.get('/school', settingsController.getSchoolIdentity); // Publicly accessible branding
router.get('/', auth, settingsController.getSettings);
router.put('/whatsapp', auth, settingsController.updateWhatsAppSettings);
router.put('/sms', auth, settingsController.updateSMSSettings);
router.put('/billing', auth, settingsController.updateBillingSettings);

module.exports = router;
