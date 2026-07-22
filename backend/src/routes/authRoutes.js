const express = require('express');
const router = express.Router();
const { googleLogin, getAuthConfig } = require('../controllers/authController');
const { validateGoogleLogin } = require('../middlewares/requestValidator');

// POST /api/auth/google
router.post('/google', validateGoogleLogin, googleLogin);

// GET /api/auth/config
router.get('/config', getAuthConfig);

module.exports = router;

