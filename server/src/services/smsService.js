const axios = require('axios');
const SchoolSettings = require('../models/SchoolSettings');

const sendSMS = async (phoneNumber, text) => {
    const settings = await SchoolSettings.getSettings();

    if (!settings.sms || !settings.sms.isActive || !settings.sms.deviceId || !settings.sms.apiKey) {
        throw new Error('Textbee.dev SMS Gateway is not fully configured. Please configure it in the Admin Dashboard.');
    }

    const DEVICE_ID = settings.sms.deviceId;
    const API_KEY = settings.sms.apiKey;

    // Standardize phone number format for textbee (+ international format)
    let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedNumber.startsWith('03')) {
        formattedNumber = '92' + formattedNumber.slice(1);
    }
    formattedNumber = '+' + formattedNumber;

    try {
        // Textbee Payload
        const payload = {
            receivers: [formattedNumber],
            smsBody: text
        };

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        };

        const url = `https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/sendSMS`;
        const response = await axios.post(url, payload, { headers });

        return {
            success: true,
            messageId: response.data?.data?._id || Date.now().toString(),
            rawResponse: response.data
        };
    } catch (error) {
        console.error('Error sending SMS via physical gateway:', error.message);
        throw new Error('Failed to reach Android SMS Gateway. Ensure the phone is connected to the network.');
    }
};

module.exports = {
    sendSMS
};
