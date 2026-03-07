const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const whatsappService = require('../services/whatsappService');
const smsService = require('../services/smsService');

// @desc    Get all conversations
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .populate('linkedStudentId', 'studentName studentId')
            .populate('linkedInquiryId', 'studentName')
            .sort({ lastMessageAt: -1 });

        res.status(200).json(conversations);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .sort({ createdAt: 1 });

        // Reset unread count when opening a chat
        await Conversation.findByIdAndUpdate(req.params.conversationId, { unreadCount: 0 });

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Send a new message
// @route   POST /api/chat/send
// @access  Private
exports.sendMessage = async (req, res) => {
    const { phoneNumber, content, channel, studentId, inquiryId, type, templateName, languageCode, components } = req.body;
    const file = req.file;

    if (!phoneNumber || (!content && !file && type !== 'template') || !channel) {
        return res.status(400).json({ message: 'Phone number, content/file/template, and channel are required' });
    }

    try {
        // Find or create conversation
        let conversation = await Conversation.findOne({ phoneNumber });

        if (!conversation) {
            conversation = await Conversation.create({
                phoneNumber,
                linkedStudentId: studentId || undefined,
                linkedInquiryId: inquiryId || undefined
            });
        } else {
            // Update links if new ones are provided
            if (studentId) conversation.linkedStudentId = studentId;
            if (inquiryId) conversation.linkedInquiryId = inquiryId;
            conversation.lastMessageAt = Date.now();
            await conversation.save();
        }

        let sendResult = { success: false, messageId: null, error: null };
        let mediaId = null;
        let mediaType = null;
        let mimeType = null;

        // Attempt delivery based on selected channel
        try {
            if (channel === 'whatsapp') {
                if (type === 'template') {
                    const parsedComponents = components ? JSON.parse(components) : [];
                    sendResult = await whatsappService.sendTemplateMessage(phoneNumber, templateName, languageCode || 'en_US', parsedComponents);
                    mediaType = 'template';
                } else if (file) {
                    mimeType = file.mimetype;
                    if (mimeType.startsWith('image/')) mediaType = 'image';
                    else if (mimeType.startsWith('video/')) mediaType = 'video';
                    else if (mimeType.startsWith('audio/')) mediaType = 'audio';
                    else mediaType = 'document';

                    mediaId = await whatsappService.uploadMedia(file.buffer, mimeType, file.originalname);
                    sendResult = await whatsappService.sendMediaMessage(phoneNumber, mediaId, mediaType, content);
                } else {
                    sendResult = await whatsappService.sendMessage(phoneNumber, content);
                }
            } else if (channel === 'sms') {
                if (file) {
                    return res.status(400).json({ message: 'SMS channel does not support media attachments' });
                }
                sendResult = await smsService.sendSMS(phoneNumber, content);
            } else {
                return res.status(400).json({ message: 'Invalid channel specified' });
            }
        } catch (deliveryError) {
            console.error("Delivery error:", deliveryError.message);
            sendResult = { success: false, messageId: null, error: deliveryError.message };
        }

        // Save the outbound message to the database
        const message = await Message.create({
            conversationId: conversation._id,
            sender: 'school',
            content: type === 'template' && !content ? `[Template Built-in: ${templateName}]` : (content || ''),
            hasMedia: !!file || type === 'template',
            mediaType: mediaType || undefined,
            mediaUrl: mediaId ? `meta_id:${mediaId}` : undefined,
            channel,
            status: sendResult.success ? 'sent' : 'failed',
            externalId: sendResult.messageId
        });

        // Emit via socket io to update UI
        const io = req.app.get('socketio');
        if (io) {
            io.emit('new_message', { conversationId: conversation._id, message });
        }

        if (sendResult.success) {
            res.status(201).json({ message, deliveryStatus: sendResult });
        } else {
            res.status(400).json({ message: sendResult.error || 'Failed to deliver message', savedMessage: message });
        }

    } catch (err) {
        console.error("General error in sendMessage:", err);
        res.status(500).json({ message: 'Failed to process message request', error: err.message });
    }
};

// @desc    Download Media
// @route   GET /api/chat/media/:mediaId
// @access  Private
exports.downloadMedia = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { stream, mimeType } = await whatsappService.getMediaContent(mediaId);

        res.setHeader('Content-Type', mimeType);
        stream.pipe(res);
    } catch (err) {
        console.error('Error downloading media proxy:', err);
        res.status(500).json({ message: 'Failed to download media' });
    }
};

// @desc    Get WhatsApp connection status
// @route   GET /api/chat/whatsapp/status
// @access  Private
// @desc    Get WhatsApp connection status (Cloud API)
// @route   GET /api/chat/whatsapp/status
// @access  Private
exports.getWhatsAppStatus = async (req, res) => {
    try {
        const payload = await whatsappService.getStatus();
        res.status(200).json(payload);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @desc    Validate if a number is formatted (Cloud API ignores actual WA registry check during pre-flight)
// @route   GET /api/chat/whatsapp/validate/:phone
// @access  Private
exports.validateWhatsApp = async (req, res) => {
    const { phone } = req.params;
    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const result = await whatsappService.validateNumber(phone);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Validation failed', error: err.message });
    }
};

// --- META CLOUD API WEBHOOKS ---

// @desc    Verify Meta Webhook Challenge
// @route   GET /api/chat/whatsapp/webhook
// @access  Public (Meta calls this)
exports.verifyWebhook = async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    try {
        const SchoolSettings = require('../models/SchoolSettings');
        const settings = await SchoolSettings.getSettings();

        const verifyToken = settings.whatsapp.webhookVerifyToken;

        if (mode && token) {
            if (mode === 'subscribe' && token === verifyToken) {
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        }
    } catch (err) {
        console.error('Error verifying webhook:', err);
        res.sendStatus(500);
    }
};

// @desc    Process Incoming Meta Webhook Payload
// @route   POST /api/chat/whatsapp/webhook
// @access  Public (Meta calls this)
exports.processWebhook = async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let messageObj = body.entry[0].changes[0].value.messages[0];
            let from = messageObj.from;

            // Reverse format international Meta number back to local 03XX format
            if (from.startsWith('923') && from.length === 12) {
                from = '03' + from.substring(3);
            }

            let msg_body = '';
            let hasMedia = false;
            let mediaType = undefined;
            let mediaUrl = undefined;

            if (messageObj.type === 'image') {
                hasMedia = true;
                mediaType = 'image';
                mediaUrl = `meta_id:${messageObj.image.id}`;
                msg_body = `[Image: ${messageObj.image.caption || 'Attached'}]`;
            } else if (messageObj.type === 'document') {
                hasMedia = true;
                mediaType = 'document';
                mediaUrl = `meta_id:${messageObj.document.id}`;
                msg_body = `[Document: ${messageObj.document.filename || 'File attached'}]`;
            } else if (messageObj.type === 'audio') {
                hasMedia = true;
                mediaType = 'audio';
                mediaUrl = `meta_id:${messageObj.audio.id}`;
                msg_body = '[Audio/Voice Message]';
            } else if (messageObj.type === 'video') {
                hasMedia = true;
                mediaType = 'video';
                mediaUrl = `meta_id:${messageObj.video.id}`;
                msg_body = `[Video: ${messageObj.video.caption || 'Attached'}]`;
            } else if (messageObj.type === 'text') {
                msg_body = messageObj.text.body;
            } else {
                msg_body = `[Unsupported Meta Message Type: ${messageObj.type}]`;
            }

            console.log(`Incoming Cloud API Message from ${from}: ${msg_body}`);

            try {
                // Find or create conversation
                let conversation = await Conversation.findOne({ phoneNumber: from });

                if (!conversation) {
                    conversation = await Conversation.create({
                        phoneNumber: from,
                    });
                }

                conversation.lastMessageAt = Date.now();
                conversation.unreadCount += 1;
                await conversation.save();

                // Save the incoming message
                const savedMessage = await Message.create({
                    conversationId: conversation._id,
                    sender: 'parent',
                    content: msg_body,
                    hasMedia,
                    mediaType,
                    mediaUrl,
                    channel: 'whatsapp',
                    status: 'delivered',
                    externalId: messageObj.id
                });

                // Push to frontend via socket
                const io = req.app.get('socketio');
                if (io) {
                    io.emit('new_message', {
                        conversationId: conversation._id,
                        message: savedMessage,
                        isNewConversation: conversation.isNew
                    });
                }
            } catch (err) {
                console.error("Error processing incoming webhook message to DB:", err);
            }
        } else if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.statuses) {
            // Meta also sends Delivery/Read status updates here. 
            // We can parse them and emit a socket event to update the CSS ticks on messages!
            const statusUpdate = body.entry[0].changes[0].value.statuses[0];

            try {
                // Permanently save the delivery status to the database so it survives page reloads
                await Message.findOneAndUpdate(
                    { externalId: statusUpdate.id },
                    { status: statusUpdate.status }
                );

                const io = req.app.get('socketio');
                if (io) {
                    io.emit('message_status_update', {
                        externalId: statusUpdate.id,
                        status: statusUpdate.status // 'sent', 'delivered', 'read'
                    });
                }
            } catch (err) {
                console.error("Error updating message status in DB:", err);
            }
        }
        res.sendStatus(200);
    } else {
        // Return a '404 Not Found' if event is not from a WhatsApp API
        res.sendStatus(404);
    }
};

// @desc    Process Incoming Textbee SMS Webhook Payload
// @route   POST /api/chat/sms/webhook
// @access  Public (Textbee.dev calls this)
exports.smsWebhook = async (req, res) => {
    const body = req.body;

    if (body && body.webhookEvent === 'MESSAGE_RECEIVED') {
        let from = body.sender;
        const msg_body = body.message;
        const smsId = body.smsId;

        // Reverse format international +92 back to local 03XX format
        if (from.startsWith('+923') && from.length === 13) {
            from = '03' + from.substring(3);
        } else if (from.startsWith('923') && from.length === 12) {
            from = '03' + from.substring(2);
        }

        console.log(`Incoming Textbee SMS from ${from}: ${msg_body}`);

        try {
            // Find or create conversation
            let conversation = await Conversation.findOne({ phoneNumber: from });

            if (!conversation) {
                conversation = await Conversation.create({
                    phoneNumber: from,
                });
            }

            conversation.lastMessageAt = Date.now();
            conversation.unreadCount += 1;
            await conversation.save();

            // Save the incoming message
            const savedMessage = await Message.create({
                conversationId: conversation._id,
                sender: 'parent',
                content: msg_body,
                hasMedia: false,
                channel: 'sms',
                status: 'delivered',
                externalId: smsId
            });

            // Push to frontend via socket
            const io = req.app.get('socketio');
            if (io) {
                io.emit('new_message', {
                    conversationId: conversation._id,
                    message: savedMessage,
                    isNewConversation: conversation.isNew
                });
            }
        } catch (err) {
            console.error("Error processing incoming SMS webhook to DB:", err);
        }
        res.sendStatus(200);
    } else {
        // Return 200 so textbee doesn't endlessly retry unsupported events
        res.sendStatus(200);
    }
};
