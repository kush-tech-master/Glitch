const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');

router.route('/').get(getSettings).post(updateSettings);

module.exports = router;
