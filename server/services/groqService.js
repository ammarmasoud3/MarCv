'use strict';

/**
 * server/services/groqService.js
 * Wrapper around the Groq REST API using native fetch (no SDK).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Sends raw text to Groq API to parse it into structured CV JSON.
 *
 * @param {string} rawText
 * @returns {Promise<object>} Parsed CV data structure
 */
async function parseCVWithGroq(rawText) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('Groq API key is not configured. Please check your .env file.');
  }

  const systemPrompt = `You are an expert ATS-friendly resume parser.
Your task is to take unstructured raw career information and format it into a structured JSON object.
Do not omit details. Summarize experience bullet points professionally. Correct typos if necessary but preserve factual details.

The JSON object MUST follow this exact schema:
{
  "personalInfo": {
    "name": "String",
    "email": "String",
    "phone": "String",
    "linkedin": "String (optional/empty if not found)",
    "location": "String (optional/empty if not found)",
    "website": "String (optional/empty if not found)"
  },
  "summary": "String (professional summary or profile statement, generate a concise one if not provided based on the experiences)",
  "education": [
    {
      "degree": "String",
      "institution": "String",
      "location": "String (optional/empty if not found)",
      "startDate": "String (optional/empty if not found)",
      "endDate": "String (optional/empty if not found)",
      "gpa": "String (optional/empty if not found)"
    }
  ],
  "experience": [
    {
      "company": "String",
      "role": "String",
      "location": "String (optional/empty if not found)",
      "startDate": "String (optional/empty if not found)",
      "endDate": "String (optional/empty if not found)",
      "description": ["Array of professional accomplishment statements (bullet points)"]
    }
  ],
  "skills": [
    {
      "category": "String (e.g. Frontend Development, Databases, Tools, Languages)",
      "items": ["Array of skills under this category"]
    }
  ],
  "projects": [
    {
      "name": "String",
      "description": "String",
      "technologies": ["Array of technologies used"],
      "url": "String (optional/empty if not found)"
    }
  ],
  "certifications": [
    {
      "name": "String",
      "issuer": "String",
      "date": "String (optional/empty if not found)"
    }
  ],
  "languages": ["Array of languages spoken (e.g. Arabic, English)"]
}

If a section is missing from the input text, return an empty array or empty object matching the structure above. Do not include comments or Markdown formatting in your response. Return ONLY the raw JSON object.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  const responseData = await response.json();

  if (!response.ok) {
    const errorMessage = responseData.error?.message || `Groq API returned HTTP ${response.status}`;
    throw new Error(`Groq API Error: ${errorMessage}`);
  }

  try {
    const parsedContent = JSON.parse(responseData.choices[0].message.content);
    return parsedContent;
  } catch (e) {
    throw new Error('Failed to parse the response from Groq API as JSON.');
  }
}

module.exports = { parseCVWithGroq };
