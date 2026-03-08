const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middlewares/auth');
const multer = require('multer');

// Use memory storage for fast, direct pass-through to Meta API without saving to disk
const upload = multer({ storage: multer.memoryStorage() });

router.get('/conversations', auth, chatController.getConversations);
router.get('/messages/:conversationId', auth, chatController.getMessages);
router.post('/send', auth, upload.single('attachment'), chatController.sendMessage);
router.post('/blast', auth, chatController.sendBulkBlast);
router.get('/media/:mediaId', auth, chatController.downloadMedia);
router.get('/whatsapp/status', auth, chatController.getWhatsAppStatus);
router.get('/whatsapp/validate/:phone', auth, chatController.validateWhatsApp);

// Meta Cloud API Webhooks (Public - Auth handled by verify_token/signature internally)
router.get('/whatsapp/webhook', chatController.verifyWebhook);
router.post('/whatsapp/webhook', chatController.processWebhook);

// Textbee SDK SMS Webhook (Public)
router.post('/sms/webhook', chatController.smsWebhook);

module.exports = router;
