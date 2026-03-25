// src/models/SchoolSettings.js
const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
    // School Identity
    schoolName: {
        type: String,
        required: true,
        default: 'Fi Das Liceyum School'
    },

    // WhatsApp Cloud API Credentials
    whatsapp: {
        phoneNumberId: {
            type: String,
            default: '' // From Meta Developer Portal -> WhatsApp -> API Setup -> Phone number ID
        },
        accessToken: {
            type: String,
            default: '' // System User Access Token
        },
        webhookVerifyToken: {
            type: String,
            default: 'liceyum_secure_webhook_123' // Custom token for webhook verification
        },
        isActive: {
            type: Boolean,
            default: false
        }
    },

    // Android/Local SMS Gateway Credentials
    sms: {
        deviceId: {
            type: String,
            default: '' // Textbee.dev Device ID
        },
        apiKey: {
            type: String,
            default: '' // Optional auth header for the SMS app
        },
        isActive: {
            type: Boolean,
            default: false
        }
    },

    // Enterprise Billing Rules
    billing: {
        feePlanCategories: {
            type: [String],
            default: ['Default Plan']
        },
        earlyBirdDiscountPercentage: {
            type: Number,
            default: 10
        },
        earlyBirdValidityDays: {
            type: Number,
            default: 10
        },
        siblingDiscountIncrement: {
            type: Number,
            default: 5 // e.g., Child 1: 0%, Child 2: 5%, Child 3: 10%, Child 4: 15%
        },
        siblingDiscountCap: {
            type: Number,
            default: 5 // Maximum number of siblings to evaluate for discounts
        }
    }
}, { timestamps: true });

// Ensure only one settings document exists globally (Singleton Pattern)
schoolSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const SchoolSettings = mongoose.model('SchoolSettings', schoolSettingsSchema);
module.exports = SchoolSettings;
