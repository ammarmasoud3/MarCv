/**
 * public/js/main.js
 * MarCV – UI bootstrap, event wiring, and state management.
 * API calls are handled in api.js (submitCV).
 */

'use strict';

/* ── DOM refs ──────────────────────────────────────────────── */
const textarea        = document.getElementById('resume-input');
const charCountEl     = document.getElementById('char-count');
const btnGenerate     = document.getElementById('btn-generate');
const loadingState    = document.getElementById('loading-state');
const responsePanel   = document.getElementById('response-panel');
const responseMessage = document.getElementById('response-message');
const responseCharCount = document.getElementById('response-char-count');
const responseTimestamp = document.getElementById('response-timestamp');
const btnReset        = document.getElementById('btn-reset');
const btnDownloadPdf  = document.getElementById('btn-download-pdf');
const toastContainer  = document.getElementById('toast-container');
const footerYear      = document.getElementById('footer-year');

// Cache the current generated CV data to send for PDF export
let currentCVData = null;

// CV Preview Element Refs
const cvPreviewName           = document.getElementById('cv-preview-name');
const cvPreviewTitle          = document.getElementById('cv-preview-title');
const cvPreviewContact        = document.getElementById('cv-preview-contact');
const cvPreviewSummary        = document.getElementById('cv-preview-summary');
const cvPreviewExperience     = document.getElementById('cv-preview-experience');
const cvPreviewEducation      = document.getElementById('cv-preview-education');
const cvPreviewProjects       = document.getElementById('cv-preview-projects');
const cvPreviewSkills         = document.getElementById('cv-preview-skills');
const cvPreviewAchievements   = document.getElementById('cv-preview-achievements');
const cvPreviewCertifications = document.getElementById('cv-preview-certifications');
const cvPreviewLanguages      = document.getElementById('cv-preview-languages');
const cvPreviewAwards         = document.getElementById('cv-preview-awards');

// Section Containers (to toggle visibility)
const cvSummarySec  = document.getElementById('cv-p-summary-section');
const cvExpSec      = document.getElementById('cv-p-experience-section');
const cvEduSec      = document.getElementById('cv-p-education-section');
const cvProjSec     = document.getElementById('cv-p-projects-section');
const cvSkillsSec   = document.getElementById('cv-p-skills-section');
const cvAchievementsSec = document.getElementById('cv-p-achievements-section');
const cvAdditionalSec = document.getElementById('cv-p-additional-section');

// Sub-blocks inside Additional Information
const cvCertSubblock = document.getElementById('cv-p-cert-subblock');
const cvLangSubblock = document.getElementById('cv-p-lang-subblock');
const cvAwardsSubblock = document.getElementById('cv-p-awards-subblock');

/* ── Initialise footer year ────────────────────────────────── */
if (footerYear) footerYear.textContent = new Date().getFullYear();

/* ── Character counter ─────────────────────────────────────── */
function updateCharCount() {
  const count = textarea.value.length;
  charCountEl.textContent = count;

  if (count >= 7500)      charCountEl.style.color = '#f87171';
  else if (count >= 6000) charCountEl.style.color = '#fbbf24';
  else                    charCountEl.style.color = '';
}

textarea.addEventListener('input', updateCharCount);

/* ── Toast system ──────────────────────────────────────────── */
/**
 * @param {string} message
 * @param {'info'|'success'|'error'} [type='info']
 * @param {number} [duration=4000]
 */
function showToast(message, type = 'info', duration = 4000) {
  const icons = { info: 'ℹ️', success: '✅', error: '❌' };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span aria-hidden="true">${icons[type]}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ── Response panel helpers ────────────────────────────────── */
/**
 * Populate and reveal the response panel with data from the API.
 * @param {object} data - Structured JSON CV object from Groq.
 */
function showResponsePanel(data) {
  // Populate the CV layout elements using data returned by Groq
  renderCV(data);

  // Set response headers / statistics
  const prettyJson = data ? JSON.stringify(data, null, 2) : '';
  const charCount = prettyJson.length;
  responseMessage.textContent   = 'CV Rendered Successfully!';
  responseCharCount.textContent = `${Number(charCount ?? 0).toLocaleString()} characters of CV data`;
  responseTimestamp.textContent = `at ${new Date().toLocaleTimeString()}`;

  // Reveal panel
  responsePanel.classList.add('visible');
  responsePanel.setAttribute('aria-hidden', 'false');

  // Scroll into view
  responsePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResponsePanel() {
  responsePanel.classList.remove('visible');
  responsePanel.setAttribute('aria-hidden', 'true');
  responseMessage.textContent = '';
}

/* ── UI state machine ──────────────────────────────────────── */
/**
 * @typedef {'idle'|'loading'|'done'|'error'} AppState
 * @type {AppState}
 */
let state = 'idle';

function setState(newState) {
  state = newState;

  const isLoading = newState === 'loading';
  const isDone    = newState === 'done';

  // Button
  btnGenerate.disabled = isLoading;
  btnGenerate.querySelector('.btn-label').textContent = isLoading
    ? 'Sending…'
    : 'Generate My CV';
  btnGenerate.querySelector('.btn-icon').textContent = isLoading ? '⏳' : '✨';

  // Loading spinner
  loadingState.classList.toggle('visible', isLoading);

  // Textarea
  textarea.disabled = isLoading;

  // Response panel – hide when not done
  if (!isDone) hideResponsePanel();
}

/* ── Generate button handler ───────────────────────────────── */
btnGenerate.addEventListener('click', async () => {
  const raw = textarea.value.trim();

  if (!raw) {
    showToast('Please enter your resume information first.', 'error');
    textarea.focus();
    return;
  }

  if (raw.length < 80) {
    showToast('Add a bit more detail for a better CV result.', 'info');
    textarea.focus();
    return;
  }

  setState('loading');

  try {
    // ── POST /api/cv ────────────────────────────────────────
    const data = await submitCV(raw);    // defined in api.js
    currentCVData = data;

    setState('done');
    showResponsePanel(data);
    showToast((data && data.message) || 'CV parsed successfully!', 'success');

  } catch (err) {
    console.error('[MarCV] Request failed:', err);
    setState('idle');
    showToast(err.message || 'Something went wrong. Please try again.', 'error');
  }
});

/* ── Reset button ──────────────────────────────────────────── */
btnReset.addEventListener('click', () => {
  currentCVData = null;
  setState('idle');
  textarea.value = '';
  updateCharCount();
  textarea.focus();
});

/* ── Keyboard: Ctrl/Cmd + Enter to submit ──────────────────── */
textarea.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    btnGenerate.click();
  }
});

/* ── Download PDF button handler ───────────────────────────── */
btnDownloadPdf.addEventListener('click', async () => {
  if (!currentCVData) {
    showToast('No CV data found to export.', 'error');
    return;
  }

  // Visual feedback
  const originalText = btnDownloadPdf.innerHTML;
  btnDownloadPdf.disabled = true;
  btnDownloadPdf.innerHTML = '⏳ Exporting...';

  try {
    const blob = await downloadPDF(currentCVData);
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Compute filename based on person's name
    const name = (currentCVData.personalInfo && currentCVData.personalInfo.name) || 'Resume';
    const safeName = name
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
      
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}-CV.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke URL to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    
    showToast('PDF downloaded successfully!', 'success');
  } catch (err) {
    console.error('[MarCV] PDF download failed:', err);
    showToast(err.message || 'Failed to generate PDF. Please try again.', 'error');
  } finally {
    btnDownloadPdf.disabled = false;
    btnDownloadPdf.innerHTML = originalText;
  }
});

/* ── Drag-and-drop plain text onto the textarea ────────────── */
textarea.addEventListener('dragover', (e) => {
  e.preventDefault();
  textarea.style.borderColor = 'var(--clr-primary)';
});

textarea.addEventListener('dragleave', () => {
  textarea.style.borderColor = '';
});

textarea.addEventListener('drop', (e) => {
  e.preventDefault();
  textarea.style.borderColor = '';
  const text = e.dataTransfer.getData('text/plain');
  if (text) {
    textarea.value = text;
    updateCharCount();
    showToast('Text added via drag-and-drop.', 'info');
  }
});

/* ── CV Rendering engine ─────────────────────────────────── */
function renderCV(cv) {
  if (!cv) return;

  // 1. Personal Info
  const pi = cv.personalInfo || {};
  cvPreviewName.textContent = pi.name || 'Your Name';

  // Job Title Title (fallback to first experience role)
  const title = pi.title || pi.role || (cv.experience && cv.experience[0] && cv.experience[0].role) || '';
  if (title) {
    cvPreviewTitle.textContent = title;
    cvPreviewTitle.style.display = 'block';
  } else {
    cvPreviewTitle.style.display = 'none';
  }

  // Contact line: centered dot separated text
  const contactParts = [];
  if (pi.email) contactParts.push(escapeHTML(pi.email));
  if (pi.phone) contactParts.push(escapeHTML(pi.phone));
  if (pi.location) contactParts.push(escapeHTML(pi.location));
  if (pi.website) {
    const cleanUrl = pi.website.startsWith('http') ? pi.website : `https://${pi.website}`;
    contactParts.push(`<a href="${escapeHTML(cleanUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(pi.website)}</a>`);
  }
  if (pi.linkedin) {
    const cleanUrl = pi.linkedin.startsWith('http') ? pi.linkedin : `https://${pi.linkedin}`;
    const cleanText = pi.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '');
    contactParts.push(`<a href="${escapeHTML(cleanUrl)}" target="_blank" rel="noopener noreferrer">linkedin.com/in/${escapeHTML(cleanText)}</a>`);
  }
  cvPreviewContact.innerHTML = contactParts.join(' &nbsp;|&nbsp; ');

  // 2. Summary
  if (cv.summary) {
    cvPreviewSummary.textContent = cv.summary;
    cvSummarySec.style.display = 'block';
  } else {
    cvSummarySec.style.display = 'none';
  }

  // 3. Skills Columns (Categories in grid blocks)
  cvPreviewSkills.innerHTML = '';
  const skills = cv.skills || [];
  if (skills.length > 0) {
    skills.forEach(skillCat => {
      if (!skillCat.category || !skillCat.items || skillCat.items.length === 0) return;
      const catBlock = document.createElement('div');
      catBlock.className = 'cv-p-skill-cat';

      catBlock.innerHTML = `
        <div class="cv-p-skill-cat-title">${escapeHTML(skillCat.category)}</div>
        <div class="cv-p-skill-chips">
          ${skillCat.items.map(s => `<span class="cv-p-skill-chip">${escapeHTML(s)}</span>`).join('')}
        </div>
      `;
      cvPreviewSkills.appendChild(catBlock);
    });
    cvSkillsSec.style.display = 'block';
  } else {
    cvSkillsSec.style.display = 'none';
  }

  // 4. Key Achievements
  cvPreviewAchievements.innerHTML = '';
  const achievements = cv.keyAchievements || cv.achievements || [];
  if (achievements.length > 0) {
    achievements.forEach(ach => {
      const li = document.createElement('li');
      li.textContent = ach;
      cvPreviewAchievements.appendChild(li);
    });
    cvAchievementsSec.style.display = 'block';
  } else {
    cvAchievementsSec.style.display = 'none';
  }

  // 5. Professional Experience
  cvPreviewExperience.innerHTML = '';
  const experiences = cv.experience || [];
  if (experiences.length > 0) {
    experiences.forEach(exp => {
      const item = document.createElement('div');
      item.className = 'cv-p-item';

      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
      const location = exp.location ? exp.location : '';
      const companyName = exp.company || 'Company Name';

      const bulletsHtml = (exp.description || []).map(b => `<li>${escapeHTML(b)}</li>`).join('');

      item.innerHTML = `
        <div class="cv-p-item-header">
          <span class="cv-p-item-org">${escapeHTML(companyName)}${location ? `, ${escapeHTML(location)}` : ''}</span>
          <span class="cv-p-item-meta">${escapeHTML(dates)}</span>
        </div>
        ${exp.role ? `<div class="cv-p-item-sub">${escapeHTML(exp.role)}</div>` : ''}
        ${bulletsHtml ? `<ul class="cv-p-item-bullets">${bulletsHtml}</ul>` : ''}
      `;
      cvPreviewExperience.appendChild(item);
    });
    cvExpSec.style.display = 'block';
  } else {
    cvExpSec.style.display = 'none';
  }

  // 6. Education
  cvPreviewEducation.innerHTML = '';
  const educationList = cv.education || [];
  if (educationList.length > 0) {
    educationList.forEach(edu => {
      const item = document.createElement('div');
      item.className = 'cv-p-item';

      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
      const location = edu.location ? edu.location : '';
      const university = edu.institution || 'University Name';

      item.innerHTML = `
        <div class="cv-p-item-header">
          <span class="cv-p-item-org">${escapeHTML(university)}${location ? `, ${escapeHTML(location)}` : ''}</span>
          <span class="cv-p-item-meta">${escapeHTML(dates)}</span>
        </div>
        <div class="cv-p-item-sub">
          ${escapeHTML(edu.degree || '')}
          ${edu.gpa ? `<span style="font-weight: normal; font-style: normal; color: #4b5563;"> | GPA: ${escapeHTML(edu.gpa)}</span>` : ''}
        </div>
      `;
      cvPreviewEducation.appendChild(item);
    });
    cvEduSec.style.display = 'block';
  } else {
    cvEduSec.style.display = 'none';
  }

  // 7. Projects
  cvPreviewProjects.innerHTML = '';
  const projects = cv.projects || [];
  if (projects.length > 0) {
    projects.forEach(proj => {
      const item = document.createElement('div');
      item.className = 'cv-p-item';

      let rightHeader = '';
      if (proj.url) {
        const cleanUrl = proj.url.startsWith('http') ? proj.url : `https://${proj.url}`;
        rightHeader = `<a href="${escapeHTML(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="cv-p-item-meta" style="text-decoration: underline;">View Project ↗</a>`;
      }

      const techHtml = (proj.technologies || []).map(t => `<span class="cv-p-skill-chip">${escapeHTML(t)}</span>`).join('');

      item.innerHTML = `
        <div class="cv-p-item-header">
          <span class="cv-p-item-org">${escapeHTML(proj.name || '')}</span>
          ${rightHeader}
        </div>
        ${proj.description ? `<p style="font-size: 9.5pt; color: #334155; margin-top: 2px;">${escapeHTML(proj.description)}</p>` : ''}
        ${techHtml ? `<div class="cv-p-skill-chips" style="margin-top: 4px;">${techHtml}</div>` : ''}
      `;
      cvPreviewProjects.appendChild(item);
    });
    cvProjSec.style.display = 'block';
  } else {
    cvProjSec.style.display = 'none';
  }

  // 8. Additional Information (Languages, Certifications, Awards)
  cvPreviewCertifications.innerHTML = '';
  cvPreviewLanguages.innerHTML = '';
  cvPreviewAwards.innerHTML = '';

  const certifications = cv.certifications || [];
  const languages = cv.languages || [];
  const awards = cv.awards || [];

  let hasAdditional = false;

  if (certifications.length > 0) {
    certifications.forEach(cert => {
      const li = document.createElement('li');
      let details = '';
      if (cert.issuer) details += ` by ${cert.issuer}`;
      if (cert.date) details += ` (${cert.date})`;
      li.innerHTML = `<strong>${escapeHTML(cert.name || '')}</strong>${escapeHTML(details)}`;
      cvPreviewCertifications.appendChild(li);
    });
    cvCertSubblock.style.display = 'block';
    hasAdditional = true;
  } else {
    cvCertSubblock.style.display = 'none';
  }

  if (languages.length > 0) {
    languages.forEach(lang => {
      const li = document.createElement('li');
      li.textContent = lang;
      cvPreviewLanguages.appendChild(li);
    });
    cvLangSubblock.style.display = 'block';
    hasAdditional = true;
  } else {
    cvLangSubblock.style.display = 'none';
  }

  if (awards.length > 0) {
    awards.forEach(award => {
      const li = document.createElement('li');
      li.textContent = award;
      cvPreviewAwards.appendChild(li);
    });
    cvAwardsSubblock.style.display = 'block';
    hasAdditional = true;
  } else {
    cvAwardsSubblock.style.display = 'none';
  }

  if (hasAdditional) {
    cvAdditionalSec.style.display = 'block';
    
    // Adjust grid template columns based on shown sub-blocks
    const visibleCount = [certifications.length > 0, languages.length > 0, awards.length > 0].filter(Boolean).length;
    const contentContainer = cvAdditionalSec.querySelector('.cv-p-additional-content');
    if (contentContainer) {
      contentContainer.style.gridTemplateColumns = `repeat(${visibleCount}, 1fr)`;
    }
  } else {
    cvAdditionalSec.style.display = 'none';
  }
}

// Simple HTML escaping to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
