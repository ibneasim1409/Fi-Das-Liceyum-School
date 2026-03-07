const SchoolSettings = require('../models/SchoolSettings');

// @desc    Get School Settings
// @route   GET /api/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
    try {
        const settings = await SchoolSettings.getSettings();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching settings', error: err.message });
    }
};

// @desc    Update WhatsApp API Settings
// @route   PUT /api/settings/whatsapp
// @access  Private (Admin)
exports.updateWhatsAppSettings = async (req, res) => {
    const { phoneNumberId, accessToken, webhookVerifyToken, isActive } = req.body;

    try {
        const settings = await SchoolSettings.getSettings();

        settings.whatsapp.phoneNumberId = phoneNumberId;
        settings.whatsapp.accessToken = accessToken;
        settings.whatsapp.webhookVerifyToken = webhookVerifyToken;
        settings.whatsapp.isActive = isActive;

        await settings.save();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: 'Error updating WhatsApp settings', error: err.message });
    }
};

// @desc    Update SMS API Settings
// @route   PUT /api/settings/sms
// @access  Private (Admin)
exports.updateSMSSettings = async (req, res) => {
    const { deviceId, apiKey, isActive } = req.body;

    try {
        const settings = await SchoolSettings.getSettings();

        settings.sms.deviceId = deviceId;
        settings.sms.apiKey = apiKey;
        settings.sms.isActive = isActive;

        await settings.save();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: 'Error updating SMS settings', error: err.message });
    }
};
