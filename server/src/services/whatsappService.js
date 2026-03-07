const axios = require('axios');
const SchoolSettings = require('../models/SchoolSettings');

// Helper to quickly retrieve valid credentials
const getWhatsAppCredentials = async () => {
    const settings = await SchoolSettings.getSettings();
    if (!settings.whatsapp.isActive || !settings.whatsapp.phoneNumberId || !settings.whatsapp.accessToken) {
        throw new Error('WhatsApp API is not configured or activated in Settings');
    }
    return {
        phoneNumberId: settings.whatsapp.phoneNumberId,
        token: settings.whatsapp.accessToken,
        verifyToken: settings.whatsapp.webhookVerifyToken
    };
};

/**
 * Helper to normalize Pakistani phone numbers for Meta API
 * Converts '03001234567' -> '923001234567'
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    let curr = phone.toString().replace(/[^0-9]/g, '');
    if (curr.startsWith('03') && curr.length === 11) {
        curr = '92' + curr.substring(1);
    }
    return curr;
};

/**
 * Upload Media to Meta Cloud API
 * Returns the Media ID required to send an attachment
 */
const uploadMedia = async (fileBuffer, mimeType, filename) => {
    try {
        const creds = await getWhatsAppCredentials();
        const url = `https://graph.facebook.com/v19.0/${creds.phoneNumberId}/media`;

        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', fileBuffer, { filename, contentType: mimeType });
        form.append('type', mimeType);
        form.append('messaging_product', 'whatsapp');

        const response = await axios.post(url, form, {
            headers: {
                'Authorization': `Bearer ${creds.token}`,
                'User-Agent': 'curl/7.81.0',
                ...form.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        return response.data.id;
    } catch (error) {
        console.error('Meta API Error uploading media:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to upload media to WhatsApp. Check file format/size.');
    }
};

/**
 * Download Media proxy for incoming attachments
 * Meta requires two steps: 1) Get the URL from mediaId, 2) Download with Auth token
 */
const getMediaContent = async (mediaId) => {
    try {
        const creds = await getWhatsAppCredentials();

        // Step 1: Get the Media URL
        const lookupUrl = `https://graph.facebook.com/v19.0/${mediaId}`;
        const lookupRes = await axios.get(lookupUrl, {
            headers: {
                'Authorization': `Bearer ${creds.token}`,
                'User-Agent': 'curl/7.81.0'
            }
        });

        const downloadUrl = lookupRes.data.url;
        const mimeType = lookupRes.data.mime_type;

        // Step 2: Download the binary data
        const mediaRes = await axios.get(downloadUrl, {
            headers: {
                'Authorization': `Bearer ${creds.token}`,
                'User-Agent': 'curl/7.81.0'
            },
            responseType: 'stream'
        });

        return { stream: mediaRes.data, mimeType };
    } catch (error) {
        console.error('Meta API Error downloading media:', error.response?.data || error.message);
        throw new Error('Failed to retrieve media from Meta.');
    }
};

/**
 * Send a Text Message via Meta Cloud API
 * @param {string} phoneNumber - Destination number (e.g. 923001234567)
 * @param {string} text - Message body
 */
const sendMessage = async (phoneNumber, text) => {
    try {
        const creds = await getWhatsAppCredentials();
        let formattedNumber = formatPhoneNumber(phoneNumber);

        const url = `https://graph.facebook.com/v19.0/${creds.phoneNumberId}/messages`;
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedNumber,
            type: 'text',
            text: {
                preview_url: false,
                body: text
            }
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${creds.token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await axios.post(url, payload, config);

        // Return success and Meta's internal message ID
        return {
            success: true,
            messageId: response.data.messages[0].id
        };
    } catch (error) {
        console.error('Meta API Error sending text:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp message');
    }
};

/**
 * Send a Media Message (Image, Document, Audio) via Meta Cloud API
 * @param {string} phoneNumber - Destination number
 * @param {string} mediaId - The ID returned from uploadMedia
 * @param {string} mediaType - e.g. 'image', 'document', 'audio'
 * @param {string} caption - Optional text caption
 */
const sendMediaMessage = async (phoneNumber, mediaId, mediaType, caption = '') => {
    try {
        const creds = await getWhatsAppCredentials();
        let formattedNumber = formatPhoneNumber(phoneNumber);

        const url = `https://graph.facebook.com/v19.0/${creds.phoneNumberId}/messages`;

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedNumber,
            type: mediaType,
            [mediaType]: { id: mediaId }
        };

        if (caption && (mediaType === 'image' || mediaType === 'document')) {
            payload[mediaType].caption = caption;
        }

        const config = {
            headers: {
                'Authorization': `Bearer ${creds.token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await axios.post(url, payload, config);

        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        console.error('Meta API Error sending media:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send media message');
    }
};

/**
 * Send a Pre-approved Template Message via Meta Cloud API
 * @param {string} phoneNumber - Destination number
 * @param {string} templateName - Exact name of the template configured in Meta
 * @param {string} languageCode - e.g. 'en_US'
 * @param {Array} components - Array of header/body/button parameter objects
 */
const sendTemplateMessage = async (phoneNumber, templateName, languageCode = 'en_US', components = []) => {
    try {
        const creds = await getWhatsAppCredentials();
        let formattedNumber = formatPhoneNumber(phoneNumber);

        const url = `https://graph.facebook.com/v19.0/${creds.phoneNumberId}/messages`;

        const payload = {
            messaging_product: 'whatsapp',
            to: formattedNumber,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                components: components
            }
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${creds.token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await axios.post(url, payload, config);

        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        console.error('Meta API Error sending template:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send template message');
    }
};

/**
 * Validates if the CRM is configured properly. 
 * (Unlike whatsapp-web.js, we don't 'check if registered' per number easily, 
 * we just send it and listen for delivery failure webhooks).
 */
const validateNumber = async (phoneNumber) => {
    try {
        await getWhatsAppCredentials();
        let formattedNumber = formatPhoneNumber(phoneNumber);
        // Just formats it for now. True validation happens upon delivery dispatch by Meta.
        return { success: true, isRegistered: true, formattedNumber };
    } catch (err) {
        return { success: false, isRegistered: false, error: err.message };
    }
};

/**
 * Generates frontend status payload (No QR needed anymore!)
 */
const getStatus = async () => {
    try {
        const settings = await SchoolSettings.getSettings();
        if (settings.whatsapp.isActive && settings.whatsapp.phoneNumberId && settings.whatsapp.accessToken) {
            return {
                isReady: true,
                isAuthenticating: false,
                qr: null,
                reason: null,
                mode: 'cloud_api' // Tells frontend not to expect QR codes
            };
        }
        return { isReady: false, isAuthenticating: false, qr: null, reason: 'api_not_configured', mode: 'cloud_api' };
    } catch (err) {
        return { isReady: false, isAuthenticating: false, qr: null, reason: 'db_error', mode: 'cloud_api' };
    }
};

// No initWhatsApp or destroy needed since it's purely REST HTTP now!
module.exports = {
    sendMessage,
    uploadMedia,
    getMediaContent,
    sendMediaMessage,
    sendTemplateMessage,
    validateNumber,
    getStatus
};
