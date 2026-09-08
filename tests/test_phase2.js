const assert = require('assert');
const fs = require('fs');
const path = require('path');
const counterService = require('../src/services/counterService');
const surveyMapper = require('../src/utils/surveyMapper');
const pdfService = require('../src/services/pdfService');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ PHASE 2: TẠO FILE PDF TÓM TẮT');
  console.log('====================================================\n');

  // 1. Chuẩn bị dữ liệu khảo sát mẫu phong phú
  const sampleRaw = {
    gender: 'Nữ',
    ethnicity: 'Kinh',
    age: '35-49',
    edu: '5', // Đại học
    job: '6', // Làm việc tại cơ quan/tổ chức công
    q1_1: '4', q1_2: '3', q1_3: '4', q1_4: '3', q1_5: '4', q1_6: '4', q1_7: '3', q1_8: '4', q1_9: '4',
    q2: ['2', '6'], // Họp khu dân cư, Mạng internet
    q3_1: '3', q3_2: '4', q3_3: '3', q3_4: '3', q3_5: '3', q3_6: '4', q3_7: '3',
    q4: '4', // Trực tuyến
    q5: '1', // Không có sách nhiễu
    q6: '1', // Không có đưa tiền ngoài
    q7_1: '3', q7_2: '4', q7_3: '4',
    q8_1: '1', q8_2: '1', q8_3: '2', q8_4: '1', q8_5: '1', q8_6: '2', q8_7: '2',
    q9_sat_1: '5', q9_sat_2: '5', q9_sat_3: '4', q9_sat_4: '4', q9_sat_5: '5',
    q9_sat_6: '4', q9_sat_7: '5', q9_sat_8: '5', q9_sat_9: '4', q9_sat_10: '5',
    q9_sat_11: '4', q9_sat_12: '5', q9_sat_13: '5', q9_sat_14: '4', q9_sat_15: '4',
    q9_sat_16: '4', q9_sat_17: '5', q9_sat_18: '5', q9_sat_19: '4', q9_sat_20: '5',
    q9_sat_21: '4', q9_sat_22: '5', q9_sat_23: '5', q9_sat_24: '5', q9_sat_25: '5',
    q9_sat_26: '5', q9_sat_27: '5', q9_sat_28: '5', q9_sat_29: '5', q9_sat_30: '5',
    q9_sat_31: '5', q9_sat_32: '5', q9_sat_33: '5', q9_sat_34: '5', q9_sat_35: '5',
    q9_sat_36: '5', q9_sat_37: '5', q9_sat_38: '5', q9_sat_39: '5',
    q10_1: '4', q10_2: '4', q10_3: '4', q10_4: '4', q10_5: '3',
    other_feedback: 'Cán bộ Bộ phận Một cửa rất nhiệt tình, giải quyết hồ sơ nhanh chóng.',
    interviewer_name: 'Trần Thị Mai',
    survey_location: 'Bộ phận một cửa Phường Tùng Thiện',
    survey_date: '2026-09-08'
  };

  const codeObj = await counterService.getNextCode();
  console.log(`✅ Bước 1: Khởi tạo mã phiếu khảo sát: ${codeObj.code}`);

  const mappedData = surveyMapper.mapSurveyData(sampleRaw, codeObj.code);
  console.log(`✅ Bước 2: Ánh xạ dữ liệu hoàn tất cho đối tượng: ${mappedData.personal.gender}, ${mappedData.personal.age}, ${mappedData.personal.job}`);

  // 2. Chạy tạo file PDF qua Puppeteer
  console.log('⏳ Bước 3: Đang khởi động Puppeteer và render file PDF tóm tắt...');
  const startTime = Date.now();
  const pdfResult = await pdfService.generateSummaryPdf(mappedData);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // 3. Kiểm tra file PDF trên đĩa
  assert.ok(fs.existsSync(pdfResult.filePath), `File PDF phải tồn tại tại đường dẫn: ${pdfResult.filePath}`);
  const stats = fs.statSync(pdfResult.filePath);
  assert.ok(stats.size > 5000, `Kích thước file PDF (${stats.size} bytes) phải lớn hơn 5KB`);

  // 4. Kiểm tra Header chuẩn PDF
  const buffer = fs.readFileSync(pdfResult.filePath);
  const pdfHeader = buffer.slice(0, 5).toString('ascii');
  assert.strictEqual(pdfHeader, '%PDF-', 'File xuất ra phải có định dạng chuẩn PDF (%PDF-)');

  console.log(`✅ Bước 3 & 4: Tạo PDF thành công trong ${duration}s!`);
  console.log(`   📄 Tên file: ${pdfResult.fileName}`);
  console.log(`   📂 Đường dẫn: ${pdfResult.filePath}`);
  console.log(`   ⚖️ Dung lượng: ${(stats.size / 1024).toFixed(2)} KB`);

  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ PHASE 2 ĐÃ VƯỢT QUA (PASSED)');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ KIỂM THỬ PHASE 2 THẤT BẠI:', err);
  process.exit(1);
});
