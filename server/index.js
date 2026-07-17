'use strict';

const path         = require('path');
const express      = require('express');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const cvRouter     = require('./routes/cv');
const pdfRouter    = require('./routes/pdf');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────────

// Parse incoming JSON bodies
app.use(express.json());

// Serve the frontend from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API Routes ─────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'MarCV' });
});

// CV endpoint  →  POST /api/cv
app.use('/api/cv', cvRouter);

// PDF endpoint →  POST /api/pdf
app.use('/api/pdf', pdfRouter);

// ── Error handler (must be last) ───────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`MarCV server running at http://localhost:${PORT}`);
});
