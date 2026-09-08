const assert = require('assert');
const fs = require('fs');
const path = require('path');
const counterService = require('../src/services/counterService');
const surveyMapper = require('../src/utils/surveyMapper');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ PHASE 1: COUNTER & SURVEY MAPPER');
  console.log('====================================================\n');

  // 1. Reset counter về 0 để test từ đầu
  counterService.setCounter(0, 2026);
  console.log('✅ Bước 1: Khởi tạo lại counter = 0 (Năm 2026)');

  // 2. Test sinh mã tuần tự
  const code1 = await counterService.getNextCode();
  const code2 = await counterService.getNextCode();
  const code3 = await counterService.getNextCode();

  assert.strictEqual(code1.code, 'SIPAS-TT-2026-0001', 'Mã 1 phải là SIPAS-TT-2026-0001');
  assert.strictEqual(code2.code, 'SIPAS-TT-2026-0002', 'Mã 2 phải là SIPAS-TT-2026-0002');
  assert.strictEqual(code3.code, 'SIPAS-TT-2026-0003', 'Mã 3 phải là SIPAS-TT-2026-0003');
  console.log(`✅ Bước 2: Sinh mã tuần tự thành công: [${code1.code}, ${code2.code}, ${code3.code}]`);

  // 3. Test Concurrency (Gửi đồng thời 20 requests cùng 1 thời điểm)
  console.log('⏳ Bước 3: Đang kiểm tra chạy đồng thời 20 requests cùng lúc (Concurrency Stress Test)...');
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(counterService.getNextCode());
  }

  const results = await Promise.all(promises);
  const codes = results.map(r => r.code);
  const uniqueCodes = new Set(codes);

  assert.strictEqual(uniqueCodes.size, 20, 'Tất cả 20 mã phải là duy nhất, không trùng lặp!');
  assert.strictEqual(codes[codes.length - 1], 'SIPAS-TT-2026-0023', 'Mã cuối cùng sau 3 + 20 lần phải là SIPAS-TT-2026-0023');
  console.log(`✅ Bước 3: Test Concurrency tuyệt đối thành công! Đã tạo 20 mã liên tiếp từ SIPAS-TT-2026-0004 đến ${codes[codes.length - 1]}`);

  // 4. Test Survey Mapper
  console.log('\n⏳ Bước 4: Kiểm tra ánh xạ dữ liệu khảo sát sang tiếng Việt (surveyMapper)...');
  const sampleRawData = {
    gender: 'Nam',
    ethnicity: 'Kinh',
    age: '25-34',
    edu: '5',
    job: '5',
    q1_1: '4',
    q1_2: '3',
    q2: ['1', '6'],
    q3_1: '4',
    q4: '1',
    q5: '1',
    q6: '1',
    q7_1: '4',
    q8_1: '1',
    q8_2: '2',
    q9_sat_1: '5',
    q9_sat_2: '4',
    q10_1: '4',
    other_feedback: 'Đề nghị tiếp tục duy trì dịch vụ trực tuyến thuận tiện.',
    interviewer_name: 'Nguyễn Văn A',
    survey_location: 'Bộ phận một cửa Phường Tùng Thiện',
    survey_date: '2026-09-08'
  };

  const mapped = surveyMapper.mapSurveyData(sampleRawData, 'SIPAS-TT-2026-0024');

  assert.strictEqual(mapped.code, 'SIPAS-TT-2026-0024');
  assert.strictEqual(mapped.personal.education, 'Đại học/ trên ĐH');
  assert.strictEqual(mapped.personal.job, 'Làm việc tại tổ chức, DN trong lĩnh vực tư');
  assert.strictEqual(mapped.sections.q1[0].label, 'Rất quan tâm theo dõi');
  assert.strictEqual(mapped.sections.q2, 'Qua loa phát thanh phường, Qua mạng internet (Trang TTĐT, Zalo, Facebook...)');
  assert.strictEqual(mapped.sections.q4, 'Sẽ tham gia, nếu được xin ý kiến theo bất kỳ hình thức nào');
  assert.strictEqual(mapped.sections.q8[0].value, 'Có');
  assert.strictEqual(mapped.sections.q8[1].value, 'Không');
  assert.strictEqual(mapped.sections.q9[0].label, 'Rất hài lòng (5đ)');
  assert.strictEqual(mapped.sections.otherFeedback, 'Đề nghị tiếp tục duy trì dịch vụ trực tuyến thuận tiện.');
  assert.strictEqual(mapped.interviewer.name, 'Nguyễn Văn A');

  console.log('✅ Bước 4: Ánh xạ dữ liệu khảo sát (surveyMapper) chuẩn xác 100%!');

  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ PHASE 1 ĐÃ VƯỢT QUA (PASSED)');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ KIỂM THỬ PHASE 1 THẤT BẠI:', err);
  process.exit(1);
});
