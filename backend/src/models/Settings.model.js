const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    platformName: {
        type: String,
        default: 'ClubChain Premium'
    },
    supportEmail: {
        type: String,
        default: 'support@clubchain.com'
    },
    defaultCurrency: {
        type: String,
        default: 'USD'
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    forcePasswordReset: {
        type: Boolean,
        default: false
    },
    sessionTimeout: {
        type: Number,
        default: 30 // minutes
    },
    twoFactorEnforced: {
        type: Boolean,
        default: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) {
        return settings;
    }
    return await this.create({});
};

module.exports = mongoose.model('Settings', settingsSchema);
