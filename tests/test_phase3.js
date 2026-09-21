require('dotenv').config();
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const googleAuth = require('../src/config/googleAuth');
const googleDriveService = require('../src/services/googleDriveService');
const googleSheetService = require('../src/services/googleSheetService');
const counterService = require('../src/services/counterService');
const surveyMapper = require('../src/utils/surveyMapper');
const pdfService = require('../src/services/pdfService');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ PHASE 3: GOOGLE DRIVE & SHEETS API');
  console.log('====================================================\n');

  // 1. Kiểm tra trạng thái Google Auth
  console.log('⏳ Bước 1: Kiểm tra cấu hình xác thực Google Service Account...');
  const isConfig = googleAuth.isConfigured();
  console.log(`   Trạng thái file credentials.json: ${isConfig ? '✅ ĐÃ CÓ' : '⚠️ CHƯA CÓ (Sẽ chạy Safe Mock Mode)'}`);

  // 2. Tạo 1 file PDF khảo sát mẫu để test upload
  const codeObj = await counterService.getNextCode();
  const sampleRaw = {
    gender: 'Nam',
    ethnicity: 'Kinh',
    age: '25-34',
    edu: '5',
    job: '5',
    q1_1: '4',
    q2: ['1', '6'],
    q4: '1',
    q5: '1',
    q6: '1',
    q9_sat_1: '5',
    q9_sat_2: '5',
    other_feedback: 'Dịch vụ rất tốt.'
  };

  const mappedData = surveyMapper.mapSurveyData(sampleRaw, codeObj.code);
  const pdfResult = await pdfService.generateSummaryPdf(mappedData);
  console.log(`✅ Bước 2: Tạo file PDF mẫu thành công (${pdfResult.fileName})`);

  // 3. Test Upload PDF lên Drive
  console.log('\n⏳ Bước 3: Kiểm tra Service Google Drive (Upload PDF)...');
  const driveResult = await googleDriveService.uploadPdf(pdfResult.filePath, pdfResult.fileName);
  assert.ok(driveResult.success, 'Upload Drive phải trả về success: true');
  assert.ok(driveResult.webViewLink, 'Phải có đường dẫn webViewLink');
  console.log(`✅ Bước 3: Google Drive Service phản hồi thành công:`);
  console.log(`   - Chế độ: ${driveResult.isMock ? 'Mock Fallback Mode' : 'Google Cloud Live Mode'}`);
  console.log(`   - Link Drive: ${driveResult.webViewLink}`);

  // 4. Test Ghi dòng dữ liệu vào Google Sheet
  console.log('\n⏳ Bước 4: Kiểm tra Service Google Sheet (Append Row)...');
  const sheetResult = await googleSheetService.appendSurveyRow(mappedData, driveResult.webViewLink);
  assert.ok(sheetResult.success, 'Append Sheet phải trả về success: true');
  console.log(`✅ Bước 4: Google Sheet Service phản hồi thành công:`);
  console.log(`   - Chế độ: ${sheetResult.isMock ? 'Mock Fallback Mode' : 'Google Cloud Live Mode'}`);
  console.log(`   - Số lượng cột tiêu chuẩn: ${googleSheetService.HEADERS.length} cột`);

  await pdfService.closeBrowser();
  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ PHASE 3 ĐÃ VƯỢT QUA (PASSED)');
  console.log('====================================================');
  process.exit(0);
}

runTests().catch(async err => {
  console.error('❌ KIỂM THỬ PHASE 3 THẤT BẠI:', err);
  await pdfService.closeBrowser().catch(() => {});
  process.exit(1);
});
