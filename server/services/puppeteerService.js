'use strict';

/**
 * server/services/puppeteerService.js
 * Puppeteer helpers: launch browser, render HTML template, export PDF.
 */

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * Generates an A4 PDF buffer from the structured CV JSON.
 *
 * @param {object} cv - Structured JSON CV object
 * @returns {Promise<Buffer>} PDF binary buffer
 */
async function generatePDFFromJSON(cv) {
  const templatePath = path.join(__dirname, '..', '..', 'templates', 'cv-template.html');
  let html = await fs.readFile(templatePath, 'utf8');

  // Simple HTML escape function to prevent injection/broken layouts
  function escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── 1. Personal Info ───────────────────────────────────────
  const pi = cv.personalInfo || {};
  html = html.replace('{{NAME}}', escape(pi.name || 'Your Name'));
  
  const title = pi.title || pi.role || (cv.experience && cv.experience[0] && cv.experience[0].role) || '';
  if (title) {
    html = html.replace('{{TITLE}}', escape(title));
    html = html.replace('{{SHOW_TITLE}}', '');
  } else {
    html = html.replace('{{TITLE}}', '');
    html = html.replace('{{SHOW_TITLE}}', 'display: none;');
  }

  // Contact line elements
  const contactParts = [];
  if (pi.email) contactParts.push(escape(pi.email));
  if (pi.phone) contactParts.push(escape(pi.phone));
  if (pi.location) contactParts.push(escape(pi.location));
  if (pi.website) {
    const cleanUrl = pi.website.startsWith('http') ? pi.website : `https://${pi.website}`;
    contactParts.push(`<a href="${escape(cleanUrl)}" target="_blank" rel="noopener noreferrer">${escape(pi.website)}</a>`);
  }
  if (pi.linkedin) {
    const cleanUrl = pi.linkedin.startsWith('http') ? pi.linkedin : `https://${pi.linkedin}`;
    const cleanText = pi.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '');
    contactParts.push(`<a href="${escape(cleanUrl)}" target="_blank" rel="noopener noreferrer">linkedin.com/in/${escape(cleanText)}</a>`);
  }
  html = html.replace('{{CONTACT}}', contactParts.join(' &nbsp;|&nbsp; '));

  // ── 2. Summary ─────────────────────────────────────────────
  if (cv.summary) {
    html = html.replace('{{SUMMARY}}', escape(cv.summary));
    html = html.replace('{{SHOW_SUMMARY}}', '');
  } else {
    html = html.replace('{{SUMMARY}}', '');
    html = html.replace('{{SHOW_SUMMARY}}', 'display: none;');
  }

  // ── 3. Skills Columns ──────────────────────────────────────
  const skills = cv.skills || [];
  if (skills.length > 0) {
    let skillsHtml = '';
    skills.forEach(skillCat => {
      if (!skillCat.category || !skillCat.items || skillCat.items.length === 0) return;
      const chips = skillCat.items.map(s => `<span class="skill-chip">${escape(s)}</span>`).join('');
      skillsHtml += `
        <div class="skill-cat">
          <div class="skill-cat-title">${escape(skillCat.category)}</div>
          <div class="skill-chips">${chips}</div>
        </div>
      `;
    });
    html = html.replace('{{SKILLS}}', skillsHtml);
    html = html.replace('{{SHOW_SKILLS}}', '');
  } else {
    html = html.replace('{{SKILLS}}', '');
    html = html.replace('{{SHOW_SKILLS}}', 'display: none;');
  }

  // ── 4. Achievements ────────────────────────────────────────
  const achievements = cv.keyAchievements || cv.achievements || [];
  if (achievements.length > 0) {
    const achievementsHtml = achievements.map(ach => `<li>${escape(ach)}</li>`).join('');
    html = html.replace('{{ACHIEVEMENTS}}', achievementsHtml);
    html = html.replace('{{SHOW_ACHIEVEMENTS}}', '');
  } else {
    html = html.replace('{{ACHIEVEMENTS}}', '');
    html = html.replace('{{SHOW_ACHIEVEMENTS}}', 'display: none;');
  }

  // ── 5. Experience ──────────────────────────────────────────
  const experiences = cv.experience || [];
  if (experiences.length > 0) {
    let expHtml = '';
    experiences.forEach(exp => {
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
      const location = exp.location ? exp.location : '';
      const companyName = exp.company || 'Company Name';
      const bullets = (exp.description || []).map(b => `<li>${escape(b)}</li>`).join('');
      
      expHtml += `
        <div class="item">
          <div class="item-header">
            <span class="item-org">${escape(companyName)}${location ? `, ${escape(location)}` : ''}</span>
            <span class="item-meta">${escape(dates)}</span>
          </div>
          ${exp.role ? `<div class="item-sub">${escape(exp.role)}</div>` : ''}
          ${bullets ? `<ul class="item-bullets">${bullets}</ul>` : ''}
        </div>
      `;
    });
    html = html.replace('{{EXPERIENCE}}', expHtml);
    html = html.replace('{{SHOW_EXPERIENCE}}', '');
  } else {
    html = html.replace('{{EXPERIENCE}}', '');
    html = html.replace('{{SHOW_EXPERIENCE}}', 'display: none;');
  }

  // ── 6. Education ───────────────────────────────────────────
  const educationList = cv.education || [];
  if (educationList.length > 0) {
    let eduHtml = '';
    educationList.forEach(edu => {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
      const location = edu.location ? edu.location : '';
      const university = edu.institution || 'University Name';
      
      eduHtml += `
        <div class="item">
          <div class="item-header">
            <span class="item-org">${escape(university)}${location ? `, ${escape(location)}` : ''}</span>
            <span class="item-meta">${escape(dates)}</span>
          </div>
          <div class="item-sub">
            ${escape(edu.degree || '')}
            ${edu.gpa ? `<span style="font-weight: normal; font-style: normal; color: #4b5563;"> | GPA: ${escape(edu.gpa)}</span>` : ''}
          </div>
        </div>
      `;
    });
    html = html.replace('{{EDUCATION}}', eduHtml);
    html = html.replace('{{SHOW_EDUCATION}}', '');
  } else {
    html = html.replace('{{EDUCATION}}', '');
    html = html.replace('{{SHOW_EDUCATION}}', 'display: none;');
  }

  // ── 7. Projects ────────────────────────────────────────────
  const projects = cv.projects || [];
  if (projects.length > 0) {
    let projHtml = '';
    projects.forEach(proj => {
      let rightHeader = '';
      if (proj.url) {
        const cleanUrl = proj.url.startsWith('http') ? proj.url : `https://${proj.url}`;
        rightHeader = `<a href="${escape(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="item-meta" style="text-decoration: underline;">View Project ↗</a>`;
      }
      const tech = (proj.technologies || []).map(t => `<span class="skill-chip">${escape(t)}</span>`).join('');
      
      projHtml += `
        <div class="item">
          <div class="item-header">
            <span class="item-org">${escape(proj.name || '')}</span>
            ${rightHeader}
          </div>
          ${proj.description ? `<p style="font-size: 9pt; color: #334155; margin-top: 2px;">${escape(proj.description)}</p>` : ''}
          ${tech ? `<div class="skill-chips" style="margin-top: 4px;">${tech}</div>` : ''}
        </div>
      `;
    });
    html = html.replace('{{PROJECTS}}', projHtml);
    html = html.replace('{{SHOW_PROJECTS}}', '');
  } else {
    html = html.replace('{{PROJECTS}}', '');
    html = html.replace('{{SHOW_PROJECTS}}', 'display: none;');
  }

  // ── 8. Additional Information ──────────────────────────────
  const certifications = cv.certifications || [];
  const languages = cv.languages || [];
  const awards = cv.awards || [];

  let hasAdditional = false;

  if (certifications.length > 0) {
    const certsHtml = certifications.map(cert => {
      let details = '';
      if (cert.issuer) details += ` by ${cert.issuer}`;
      if (cert.date) details += ` (${cert.date})`;
      return `<li><strong>${escape(cert.name || '')}</strong>${escape(details)}</li>`;
    }).join('');
    html = html.replace('{{CERTIFICATIONS}}', certsHtml);
    html = html.replace('{{SHOW_CERTS}}', '');
    hasAdditional = true;
  } else {
    html = html.replace('{{CERTIFICATIONS}}', '');
    html = html.replace('{{SHOW_CERTS}}', 'display: none;');
  }

  if (languages.length > 0) {
    const langsHtml = languages.map(lang => `<li>${escape(lang)}</li>`).join('');
    html = html.replace('{{LANGUAGES}}', langsHtml);
    html = html.replace('{{SHOW_LANGS}}', '');
    hasAdditional = true;
  } else {
    html = html.replace('{{LANGUAGES}}', '');
    html = html.replace('{{SHOW_LANGS}}', 'display: none;');
  }

  if (awards.length > 0) {
    const awardsHtml = awards.map(award => `<li>${escape(award)}</li>`).join('');
    html = html.replace('{{AWARDS}}', awardsHtml);
    html = html.replace('{{SHOW_AWARDS}}', '');
    hasAdditional = true;
  } else {
    html = html.replace('{{AWARDS}}', '');
    html = html.replace('{{SHOW_AWARDS}}', 'display: none;');
  }

  if (hasAdditional) {
    const cols = [certifications.length > 0, languages.length > 0, awards.length > 0].filter(Boolean).length;
    html = html.replace('{{ADDITIONAL_COLS}}', String(cols));
    html = html.replace('{{SHOW_ADDITIONAL}}', '');
  } else {
    html = html.replace('{{SHOW_ADDITIONAL}}', 'display: none;');
  }

  // Launch headless browser via Puppeteer
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    await browser.close();
    return pdfBuffer;

  } catch (err) {
    await browser.close();
    throw err;
  }
}

module.exports = { generatePDFFromJSON };
