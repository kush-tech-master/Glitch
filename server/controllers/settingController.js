const Setting = require('../models/Setting');

// @desc    Get bill settings from MongoDB
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'glitch_main_bill_settings' });
    if (!setting) {
      setting = await Setting.create({ key: 'glitch_main_bill_settings' });
    }
    res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: error.message,
    });
  }
};

// @desc    Update bill settings in MongoDB
// @route   POST /api/settings
// @access  Public
exports.updateSettings = async (req, res) => {
  try {
    const { topLeft, topRight, qrAndTerms, watermark } = req.body;
    const updated = await Setting.findOneAndUpdate(
      { key: 'glitch_main_bill_settings' },
      { topLeft, topRight, qrAndTerms, watermark },
      { new: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      message: 'Settings saved to database successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save settings',
      error: error.message,
    });
  }
};
