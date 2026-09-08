const fs = require('fs');
const path = require('path');
const counterService = require('../src/services/counterService');
const { TEMP_PDF_DIR } = require('../src/services/pdfService');

console.log('====================================================');
console.log('🧹 TIẾN HÀNH RESET TOÀN BỘ DỮ LIỆU TEST HỆ THỐNG');
console.log('====================================================\n');

// 1. Reset bộ đếm mã khảo sát về 0
const currentYear = new Date().getFullYear();
counterService.setCounter(0, currentYear);
console.log(`✅ 1. Đã reset bộ đếm mã phiếu về 0 (Phiếu tiếp theo sẽ là: SIPAS-TT-${currentYear}-0001)`);

// 2. Dọn sạch các file PDF tạm trên server
let deletedPdfCount = 0;
if (fs.existsSync(TEMP_PDF_DIR)) {
  const files = fs.readdirSync(TEMP_PDF_DIR);
  for (const file of files) {
    if (file !== '.gitkeep') {
      const fullPath = path.join(TEMP_PDF_DIR, file);
      try {
        fs.unlinkSync(fullPath);
        deletedPdfCount++;
      } catch (err) {
        console.warn(`   Không thể xóa file ${file}:`, err.message);
      }
    }
  }
}
console.log(`✅ 2. Đã dọn sạch ${deletedPdfCount} file PDF test trong thư mục data/pdf_temp/`);

console.log('\n====================================================');
console.log('🎉 RESET SERVER THÀNH CÔNG! HỆ THỐNG ĐÃ SẴN SÀNG CHẠY THẬT.');
console.log('📌 Nhắc nhở thêm:');
console.log('   - Trên Google Drive: Vào thư mục xoá các file PDF test.');
console.log('   - Trên Google Sheet: Xoá các dòng dữ liệu test (từ dòng 2 trở xuống).');
console.log('====================================================');
