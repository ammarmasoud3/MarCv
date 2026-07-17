'use strict';

/**
 * server/controllers/pdfController.js
 * Business logic for launching Puppeteer and rendering the CV as a PDF.
 */

const { generatePDFFromJSON } = require('../services/puppeteerService');

/**
 * POST /api/pdf
 * Receives the structured CV JSON and returns a compiled PDF binary stream.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function generatePDF(req, res, next) {
  try {
    const cv = req.body;

    if (!cv || typeof cv !== 'object' || Object.keys(cv).length === 0) {
      const err = new Error('Missing or invalid CV JSON payload');
      err.status = 400;
      return next(err);
    }

    console.log(`[MarCV] POST /api/pdf – generating PDF from JSON`);

    // Generate PDF buffer using Puppeteer
    const pdfBuffer = await generatePDFFromJSON(cv);

    // Format safe name for download attachment
    const name = (cv.personalInfo && cv.personalInfo.name) || 'Resume';
    const safeName = name
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // remove special characters
      .replace(/[\s_]+/g, '-')          // replace spaces/underscores with dashes
      .replace(/-+/g, '-');             // consolidate double dashes

    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-CV.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log(`[MarCV] PDF successfully exported: ${safeName}-CV.pdf (${pdfBuffer.length} bytes)`);
    return res.status(200).send(pdfBuffer);

  } catch (err) {
    next(err);
  }
}

module.exports = { generatePDF };
