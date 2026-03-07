const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth } = require('../middlewares/auth');

router.get('/', auth, settingsController.getSettings);
router.put('/whatsapp', auth, settingsController.updateWhatsAppSettings);
router.put('/sms', auth, settingsController.updateSMSSettings);

module.exports = router;
