'use strict';

/**
 * server/routes/cv.js
 * Routes for CV generation and enhancement.
 *
 * Mounted at /api/cv in server/index.js.
 */

const { Router } = require('express');
const { receiveCV } = require('../controllers/cvController');

const router = Router();

// POST /api/cv  – receive raw text, return confirmation (Groq next)
router.post('/', receiveCV);

module.exports = router;
