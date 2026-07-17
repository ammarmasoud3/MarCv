/**
 * public/js/api.js
 * MarCV – Backend API client.
 * All fetch calls to the Express server live here.
 */

'use strict';

const API_BASE = '';

/**
 * POST /api/cv
 * Sends raw resume text to the backend and returns the parsed JSON response.
 *
 * @param {string} rawText
 * @returns {Promise<object>} - Structured CV JSON object
 */
async function submitCV(rawText) {                     // eslint-disable-line no-unused-vars
  const response = await fetch(`${API_BASE}/api/cv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Unexpected response from server (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }

  return data;
}

/**
 * POST /api/pdf
 * Sends structured CV JSON to the backend and returns a compiled PDF blob.
 *
 * @param {object} cvData - Structured JSON CV data
 * @returns {Promise<Blob>} - PDF file binary blob
 */
async function downloadPDF(cvData) {                  // eslint-disable-line no-unused-vars
  const response = await fetch(`${API_BASE}/api/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cvData),
  });

  if (!response.ok) {
    let message = `Server error (${response.status})`;
    try {
      const data = await response.json();
      if (data && data.error) message = data.error;
    } catch (_) { /* ignore */ }
    throw new Error(message);
  }

  return response.blob();
}
