const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const TEMPLATE_PATH = path.join(__dirname, '../templates/summary-pdf.html');
const TEMP_PDF_DIR = path.join(__dirname, '../../data/pdf_temp');

// Ensure temp PDF directory exists
if (!fs.existsSync(TEMP_PDF_DIR)) {
  fs.mkdirSync(TEMP_PDF_DIR, { recursive: true });
}

// Pre-read template to memory cache
let cachedTemplate = null;
function getCachedTemplate() {
  if (!cachedTemplate) {
    cachedTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  }
  return cachedTemplate;
}

// Singleton browser instance
let sharedBrowser = null;
let browserInitializing = false;

// Concurrency limiter: Tối đa 6 trang đồng thời
const MAX_CONCURRENT_PAGES = 6;
let activePages = 0;
const queue = [];

/**
 * Khởi tạo hoặc lấy lại Browser dùng chung an toàn
 */
async function getBrowser() {
  if (sharedBrowser && sharedBrowser.connected) {
    return sharedBrowser;
  }

  if (browserInitializing) {
    while (browserInitializing) {
      await new Promise(r => setTimeout(r, 20));
    }
    if (sharedBrowser && sharedBrowser.connected) {
      return sharedBrowser;
    }
  }

  browserInitializing = true;
  try {
    sharedBrowser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--font-render-hinting=medium'
      ]
    });

    sharedBrowser.on('disconnected', () => {
      sharedBrowser = null;
    });

    return sharedBrowser;
  } finally {
    browserInitializing = false;
  }
}

/**
 * Khởi động nóng trình duyệt ngay khi server bật
 */
async function warmUp() {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent('<html><body>warmup</body></html>', { waitUntil: 'domcontentloaded' });
    await page.close();
    console.log('⚡ [PDF Service] Đã làm nóng trình duyệt Puppeteer sẵn sàng phục vụ.');
  } catch (err) {
    console.warn('⚠️ [PDF Service] Không thể làm nóng trình duyệt:', err.message);
  }
}

function processQueue() {
  if (activePages >= MAX_CONCURRENT_PAGES || queue.length === 0) {
    return;
  }
  const next = queue.shift();
  if (next) {
    activePages++;
    next();
  }
}

function acquireLock() {
  return new Promise((resolve) => {
    queue.push(resolve);
    processQueue();
  });
}

function releaseLock() {
  activePages--;
  processQueue();
}

/**
 * Render dynamic HTML from survey mapped data (sử dụng cache bộ nhớ)
 */
function renderHtmlTemplate(data) {
  let template = getCachedTemplate();

  const now = new Date();
  const currentDay = String(now.getDate()).padStart(2, '0');
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = now.getFullYear();

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

  // Render Q9 summary rows
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
    template = template.replace(/\{\{#hasInterviewer\}\}[\s\S]*?\{\{\/hasInterviewer\}\}/, '');
  }

  return template;
}

/**
 * Tạo file PDF siêu tốc với cơ chế tự phục hồi kết nối
 */
async function generateSummaryPdf(mappedData, customFileName) {
  const fileName = customFileName || `Phieu_SIPAS_${mappedData.code.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const filePath = path.join(TEMP_PDF_DIR, fileName);

  const htmlContent = renderHtmlTemplate(mappedData);

  await acquireLock();

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

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
  } catch (err) {
    // Nếu gặp lỗi kết nối trình duyệt, reset instance để lần sau tự kết nối lại
    sharedBrowser = null;
    throw err;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {}
    }
    releaseLock();
  }
}

async function closeBrowser() {
  if (sharedBrowser) {
    try {
      await sharedBrowser.close();
    } catch (e) {}
    sharedBrowser = null;
  }
}

module.exports = {
  generateSummaryPdf,
  renderHtmlTemplate,
  warmUp,
  getBrowser,
  closeBrowser,
  TEMP_PDF_DIR
};
