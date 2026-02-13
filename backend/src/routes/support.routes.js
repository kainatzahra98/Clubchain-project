const express = require('express');
const router = express.Router();
const { contactSupport } = require('../controllers/support.controller');

router.post('/', contactSupport);

module.exports = router;
