'use strict';

/**
 * server/routes/pdf.js
 * Routes for Puppeteer PDF generation and download.
 *
 * Mounted at /api/pdf in server/index.js.
 */

const { Router } = require('express');
const { generatePDF } = require('../controllers/pdfController');

const router = Router();

// POST /api/pdf  – generate PDF binary from structured JSON CV data
router.post('/', generatePDF);

module.exports = router;
