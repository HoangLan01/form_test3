const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const TEMPLATE_PATH = path.join(__dirname, '../templates/summary-pdf.html');
const TEMP_PDF_DIR = path.join(__dirname, '../../data/pdf_temp');

// Ensure temp PDF directory exists
if (!fs.existsSync(TEMP_PDF_DIR)) {
  fs.mkdirSync(TEMP_PDF_DIR, { recursive: true });
}

/**
 * Render dynamic HTML from survey mapped data
 */
function renderHtmlTemplate(data) {
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const now = new Date();
  const currentDay = String(now.getDate()).padStart(2, '0');
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = now.getFullYear();

  // Basic variable replacements
  template = template.replace(/\{\{code\}\}/g, data.code || '');
  template = template.replace(/\{\{submitTime\}\}/g, data.submitTime || '');
  template = template.replace(/\{\{personal\.gender\}\}/g, data.personal?.gender || '');
  template = template.replace(/\{\{personal\.age\}\}/g, data.personal?.age || '');
  template = template.replace(/\{\{personal\.ethnicity\}\}/g, data.personal?.ethnicity || '');
  template = template.replace(/\{\{personal\.education\}\}/g, data.personal?.education || '');
  template = template.replace(/\{\{personal\.job\}\}/g, data.personal?.job || '');
  template = template.replace(/\{\{sections\.q2\}\}/g, data.sections?.q2 || 'Không chọn');
  template = template.replace(/\{\{sections\.q4\}\}/g, data.sections?.q4 || 'Chưa chọn');
  template = template.replace(/\{\{sections\.q5\}\}/g, data.sections?.q5 || 'Chưa chọn');
  template = template.replace(/\{\{sections\.q6\}\}/g, data.sections?.q6 || 'Chưa chọn');
  template = template.replace(/\{\{sections\.otherFeedback\}\}/g, data.sections?.otherFeedback || 'Không có');
  
  template = template.replace(/\{\{currentDay\}\}/g, currentDay);
  template = template.replace(/\{\{currentMonth\}\}/g, currentMonth);
  template = template.replace(/\{\{currentYear\}\}/g, currentYear);

  // Render Q1 rows
  const q1RowsHtml = (data.sections?.q1 || []).map(r => `
    <tr>
      <td class="center">${r.index}</td>
      <td>${r.policy}</td>
      <td class="center bold">${r.label}</td>
    </tr>
  `).join('');
  template = template.replace(/\{\{#q1_rows\}\}[\s\S]*?\{\{\/q1_rows\}\}/, q1RowsHtml);

  // Render Q9 summary rows (Displaying top representative items or all items)
  const q9RowsHtml = (data.sections?.q9 || []).map(r => `
    <tr>
      <td class="center">${r.index}</td>
      <td>${r.item}</td>
      <td class="center bold text-success">${r.label}</td>
    </tr>
  `).join('');
  template = template.replace(/\{\{#q9_rows\}\}[\s\S]*?\{\{\/q9_rows\}\}/, q9RowsHtml);

  // Render interviewer conditional block
  const hasInterviewer = data.interviewer && (data.interviewer.name || data.interviewer.location);
  if (hasInterviewer) {
    template = template.replace(/\{\{#hasInterviewer\}\}/g, '');
    template = template.replace(/\{\{\/hasInterviewer\}\}/g, '');
    template = template.replace(/\{\{interviewer\.name\}\}/g, data.interviewer.name || 'Không ghi');
    template = template.replace(/\{\{interviewer\.location\}\}/g, data.interviewer.location || 'Không ghi');
    template = template.replace(/\{\{interviewer\.date\}\}/g, data.interviewer.date || 'Không ghi');
  } else {
    template = template.replace(/\{\{#hasInterviewer\}\}[\s\S]*?\{\{\/hasInterviewer\}\}/g, '');
  }

  return template;
}

/**
 * Generate PDF file using Puppeteer
 * @param {Object} mappedData Processed survey data from surveyMapper
 * @param {string} [customFileName]
 * @returns {Promise<{ filePath: string, fileName: string, buffer: Buffer }>}
 */
async function generateSummaryPdf(mappedData, customFileName) {
  const fileName = customFileName || `Phieu_SIPAS_${mappedData.code.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const filePath = path.join(TEMP_PDF_DIR, fileName);

  const htmlContent = renderHtmlTemplate(mappedData);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=medium'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        bottom: '12mm',
        left: '12mm',
        right: '12mm'
      }
    });

    return {
      filePath,
      fileName,
      buffer: pdfBuffer
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generateSummaryPdf,
  renderHtmlTemplate,
  TEMP_PDF_DIR
};
