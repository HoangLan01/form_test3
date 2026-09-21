require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const counterService = require('./services/counterService');
const surveyMapper = require('./utils/surveyMapper');
const pdfService = require('./services/pdfService');
const googleDriveService = require('./services/googleDriveService');
const googleSheetService = require('./services/googleSheetService');
const googleAuth = require('./config/googleAuth');

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Health check & status endpoint
 */
app.get('/api/health', (req, res) => {
  const currentState = counterService.getCurrentState();
  res.json({
    status: 'ok',
    system: 'Hệ thống Khảo sát SIPAS - UBND Phường Tùng Thiện',
    domain: 'khaosat.phuongtungthien.vn',
    googleAuth: {
      configured: googleAuth.isConfigured(),
      credentials: googleAuth.getCredentialsInfo()
    },
    counter: currentState,
    timestamp: new Date().toISOString()
  });
});

/**
 * Hàm đồng bộ dữ liệu ngầm lên Google Drive & Google Sheet (chạy nền, không chặn người dùng)
 */
async function syncToGoogleBackground(mappedData, pdfResult, code, retryCount = 0) {
  try {
    // 1. Upload file PDF vào Google Drive
    const driveResult = await googleDriveService.uploadPdf(pdfResult.filePath, pdfResult.fileName, code);

    // 2. Ghi dòng dữ liệu vào Google Sheet
    await googleSheetService.appendSurveyRow(mappedData, driveResult.webViewLink);

    console.log(`✨ [Background Sync] Đã đồng bộ xong mã ${code} lên Drive & Sheet!`);
  } catch (err) {
    console.error(`⚠️ [Background Sync] Lỗi đồng bộ ngầm cho mã ${code}:`, err.message);
    // Tự động thử lại 1 lần sau 3 giây nếu gặp sự cố mạng
    if (retryCount < 1) {
      setTimeout(() => {
        syncToGoogleBackground(mappedData, pdfResult, code, retryCount + 1);
      }, 3000);
    }
  }
}

/**
 * Endpoint tiếp nhận gửi phiếu khảo sát chính (Siêu tốc < 0.2s)
 */
app.post('/api/submit', async (req, res) => {
  const startTime = Date.now();
  try {
    const rawData = req.body;

    if (!rawData || Object.keys(rawData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu khảo sát không được để trống!'
      });
    }

    // 1. Tự động sinh mã phiếu tiếp nhận SIPAS-TT-2026-XXXX (1ms)
    const { code } = await counterService.getNextCode();
    console.log(`\n📥 [Tiếp nhận khảo sát] Mã phiếu: ${code}`);

    // 2. Ánh xạ dữ liệu sang định dạng chuẩn tiếng Việt (1ms)
    const mappedData = surveyMapper.mapSurveyData(rawData, code);

    // 3. Tạo file PDF tóm tắt cục bộ siêu tốc (~50ms)
    const pdfResult = await pdfService.generateSummaryPdf(mappedData);

    const duration = Date.now() - startTime;
    console.log(`⚡ Xử lý xong và phản hồi cho người dân trong ${duration}ms (Mã: ${code})`);

    // 4. TRẢ NGAY KẾT QUẢ THÀNH CÔNG CHO NGƯỜI DÂN (Dưới 0.2s)
    res.json({
      success: true,
      message: 'Gửi phiếu khảo sát thành công!',
      code,
      submitTime: mappedData.submitTime,
      downloadUrl: `/api/download-pdf/${encodeURIComponent(code)}`,
      responseTimeMs: duration
    });

    // 5. KÍCH HOẠT ĐỒNG BỘ CHẠY NGẦM LÊN GOOGLE DRIVE & SHEET (Không làm người dân phải chờ)
    setImmediate(() => {
      syncToGoogleBackground(mappedData, pdfResult, code);
    });

  } catch (err) {
    console.error('❌ Lỗi khi xử lý phiếu:', err);
    return res.status(500).json({
      success: false,
      error: 'Hệ thống gặp sự cố khi xử lý phiếu: ' + err.message
    });
  }
});

/**
 * Endpoint tải trực tiếp file PDF tóm tắt theo mã phiếu
 */
app.get('/api/download-pdf/:code', (req, res) => {
  try {
    const rawCode = req.params.code;
    const sanitizedCode = rawCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Phieu_SIPAS_${sanitizedCode}.pdf`;
    const filePath = path.join(pdfService.TEMP_PDF_DIR, fileName);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.sendFile(filePath);
    } else {
      return res.status(404).send('Không tìm thấy file PDF tương ứng với mã phiếu này hoặc file đã hết hạn lưu trữ tạm.');
    }
  } catch (err) {
    console.error('Lỗi khi tải PDF:', err);
    return res.status(500).send('Lỗi khi tải file PDF: ' + err.message);
  }
});

// Fallback mọi request khác về trang chủ index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Khởi chạy server khi chạy trực tiếp
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🚀 SIPAS Survey Server chạy trên: http://localhost:${PORT}`);
    console.log(`🏛️ Cơ quan: UBND Phường Tùng Thiện, Thành phố Hà Nội`);
    console.log(`📍 Địa chỉ: Số 66 đường Thanh Mỹ, TDP Thanh Mỹ, phường Tùng Thiện, thành phố Hà Nội`);
    console.log(`🌐 Tên miền: https://khaosat.phuongtungthien.vn`);
    console.log(`📋 Mã phiếu hiện tại: ${counterService.getCurrentState().code || 'Sẵn sàng khởi tạo 0001'}`);
    console.log(`====================================================`);

    // Làm nóng trình duyệt nền sẵn sàng
    await pdfService.warmUp();
    googleAuth.initAuth();
  });
}

module.exports = app;
