'use strict';

/**
 * server/controllers/cvController.js
 * Business logic for the /api/cv endpoint.
 *
 * Calls the Groq service to parse raw CV text into structured JSON.
 */

const { parseCVWithGroq } = require('../services/groqService');

/**
 * POST /api/cv
 * Accepts { rawText } and returns structured CV JSON.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function receiveCV(req, res, next) {
  try {
    const { rawText } = req.body;

    // ── Validation ───────────────────────────────────────────
    if (!rawText || typeof rawText !== 'string') {
      const err = new Error('Missing required field: rawText');
      err.status = 400;
      return next(err);
    }

    const trimmed = rawText.trim();

    if (trimmed.length === 0) {
      const err = new Error('rawText must not be empty');
      err.status = 400;
      return next(err);
    }

    if (trimmed.length > 8000) {
      const err = new Error('rawText exceeds the 8 000 character limit');
      err.status = 400;
      return next(err);
    }

    console.log(`[MarCV] POST /api/cv – sending ${trimmed.length} chars to Groq`);

    // ── Connect to Groq API ──────────────────────────────────
    const structuredCV = await parseCVWithGroq(trimmed);

    // ── Return structured JSON object only ───────────────────
    return res.status(200).json(structuredCV);

  } catch (err) {
    next(err);
  }
}

module.exports = { receiveCV };
