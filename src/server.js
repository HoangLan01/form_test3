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
const PORT = process.env.PORT || 3000;

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
 * Endpoint tiếp nhận gửi phiếu khảo sát chính
 * Quy trình: Sinh mã -> Tạo PDF -> Upload Drive -> Ghi Sheet -> Trả về kết quả
 */
app.post('/api/submit', async (req, res) => {
  try {
    const rawData = req.body;

    if (!rawData || Object.keys(rawData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu khảo sát không được để trống!'
      });
    }

    // 1. Tự động sinh mã phiếu tiếp nhận SIPAS-TT-2026-XXXX
    const { code } = await counterService.getNextCode();
    console.log(`\n📥 [Tiếp nhận khảo sát mới] Mã phiếu: ${code}`);

    // 2. Ánh xạ dữ liệu sang định dạng chuẩn tiếng Việt
    const mappedData = surveyMapper.mapSurveyData(rawData, code);

    // 3. Tạo file PDF tóm tắt chuẩn văn bản hành chính (A4)
    console.log(`⏳ Đang tạo file PDF tóm tắt cho mã ${code}...`);
    const pdfResult = await pdfService.generateSummaryPdf(mappedData);
    console.log(`✅ Đã tạo PDF thành công: ${pdfResult.fileName} (${(pdfResult.buffer.length / 1024).toFixed(1)} KB)`);

    // 4. Upload file PDF vào Google Drive của quản lý
    console.log(`⏳ Đang đồng bộ file PDF lên Google Drive...`);
    const driveResult = await googleDriveService.uploadPdf(pdfResult.filePath, pdfResult.fileName);

    // 5. Ghi 1 dòng dữ liệu khảo sát vào Google Sheet
    console.log(`⏳ Đang ghi dữ liệu vào Google Sheet...`);
    const sheetResult = await googleSheetService.appendSurveyRow(mappedData, driveResult.webViewLink);

    // 6. Trả về kết quả thành công cho người dân
    return res.json({
      success: true,
      message: 'Gửi phiếu khảo sát thành công!',
      code,
      submitTime: mappedData.submitTime,
      driveLink: driveResult.webViewLink,
      downloadUrl: `/api/download-pdf/${encodeURIComponent(code)}`,
      syncStatus: {
        drive: driveResult.success,
        sheet: sheetResult.success,
        isMockMode: driveResult.isMock || sheetResult.isMock
      }
    });

  } catch (err) {
    console.error('❌ Lỗi trong quá trình xử lý gửi phiếu:', err);
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
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 SIPAS Survey Server chạy trên: http://localhost:${PORT}`);
    console.log(`🏛️ Cơ quan: UBND Phường Tùng Thiện - Thị xã Sơn Tây`);
    console.log(`🌐 Tên miền: https://khaosat.phuongtungthien.vn`);
    console.log(`📋 Mã phiếu hiện tại: ${counterService.getCurrentState().code || 'Sẵn sàng khởi tạo 0001'}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
