const assert = require('assert');
const http = require('http');
const app = require('../src/server');

const TEST_PORT = 3456;

// Helper function to send HTTP requests
function sendRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const bodyBuffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: bodyBuffer.toString('utf8'),
          rawBuffer: bodyBuffer
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ PHASE 4: END-TO-END PIPELINE');
  console.log('====================================================\n');

  // 1. Khởi động server test
  let server;
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`✅ Bước 1: Máy chủ thử nghiệm đã khởi động trên cổng ${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // 2. Kiểm tra Endpoint Health
    console.log('\n⏳ Bước 2: Kiểm tra endpoint GET /api/health...');
    const healthRes = await sendRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/health',
      method: 'GET'
    });

    assert.strictEqual(healthRes.statusCode, 200);
    const healthData = JSON.parse(healthRes.body);
    assert.strictEqual(healthData.status, 'ok');
    console.log(`✅ Bước 2: Endpoint Health trả về 200 OK (${healthData.system})`);

    // 3. Giả lập gửi toàn bộ dữ liệu khảo sát từ Frontend (POST /api/submit)
    console.log('\n⏳ Bước 3: Gửi dữ liệu form khảo sát đầy đủ qua POST /api/submit...');
    const fullSurveyPayload = {
      gender: 'Nam',
      ethnicity: 'Kinh',
      age: '25-34',
      edu: '5',
      job: '5',
      q1_1: '4', q1_2: '3', q1_3: '4', q1_4: '4', q1_5: '4',
      q1_6: '4', q1_7: '3', q1_8: '4', q1_9: '4',
      q2: ['1', '6'],
      q3_1: '4', q3_2: '3', q3_3: '4', q3_4: '3', q3_5: '4', q3_6: '4', q3_7: '3',
      q4: '1',
      q5: '1',
      q6: '1',
      q7_1: '4', q7_2: '4', q7_3: '4',
      q8_1: '1', q8_2: '1', q8_3: '2', q8_4: '1', q8_5: '1', q8_6: '2', q8_7: '2',
      q9_sat_1: '5', q9_sat_2: '5', q9_sat_3: '5', q9_sat_4: '5', q9_sat_5: '5',
      q9_sat_6: '5', q9_sat_7: '5', q9_sat_8: '5', q9_sat_9: '5', q9_sat_10: '5',
      q9_sat_11: '5', q9_sat_12: '5', q9_sat_13: '5', q9_sat_14: '5', q9_sat_15: '5',
      q9_sat_16: '5', q9_sat_17: '5', q9_sat_18: '5', q9_sat_19: '5', q9_sat_20: '5',
      q9_sat_21: '5', q9_sat_22: '5', q9_sat_23: '5', q9_sat_24: '5', q9_sat_25: '5',
      q9_sat_26: '5', q9_sat_27: '5', q9_sat_28: '5', q9_sat_29: '5', q9_sat_30: '5',
      q9_sat_31: '5', q9_sat_32: '5', q9_sat_33: '5', q9_sat_34: '5', q9_sat_35: '5',
      q9_sat_36: '5', q9_sat_37: '5', q9_sat_38: '5', q9_sat_39: '5',
      q10_1: '4', q10_2: '4', q10_3: '4', q10_4: '4', q10_5: '4',
      other_feedback: 'Hệ thống khảo sát trực tuyến rất hiện đại, tiện lợi cho người dân.',
      interviewer_name: 'Nguyễn Văn Minh',
      survey_location: 'UBND Phường Tùng Thiện',
      survey_date: '2026-09-08'
    };

    const submitRes = await sendRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(fullSurveyPayload));

    assert.strictEqual(submitRes.statusCode, 200, 'Submit phải trả về 200 OK');
    const submitData = JSON.parse(submitRes.body);
    
    assert.strictEqual(submitData.success, true, 'success phải là true');
    assert.ok(submitData.code.startsWith('SIPAS-TT-2026-'), 'Mã phiếu phải có định dạng SIPAS-TT-2026-XXXX');
    assert.ok(submitData.submitTime, 'Phải có thời gian submit');
    assert.ok(submitData.downloadUrl, 'Phải có downloadUrl');

    console.log(`✅ Bước 3: Gửi phiếu thành công!`);
    console.log(`   - Mã phiếu tiếp nhận: ${submitData.code}`);
    console.log(`   - Thời gian ghi nhận: ${submitData.submitTime}`);
    console.log(`   - Link Drive: ${submitData.driveLink}`);
    console.log(`   - Đường dẫn tải PDF: ${submitData.downloadUrl}`);

    // 4. Kiểm tra tải file PDF trực tiếp (GET /api/download-pdf/:code)
    console.log(`\n⏳ Bước 4: Kiểm tra tải file PDF qua ${submitData.downloadUrl}...`);
    const downloadRes = await sendRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: submitData.downloadUrl,
      method: 'GET'
    });

    assert.strictEqual(downloadRes.statusCode, 200, 'Tải PDF phải trả về status 200');
    assert.strictEqual(downloadRes.headers['content-type'], 'application/pdf', 'Content-Type phải là application/pdf');
    assert.ok(downloadRes.rawBuffer.length > 5000, 'Dung lượng file PDF tải về phải > 5KB');
    
    const headerCheck = downloadRes.rawBuffer.slice(0, 5).toString('ascii');
    assert.strictEqual(headerCheck, '%PDF-', 'File tải về phải là file PDF hợp lệ');

    console.log(`✅ Bước 4: Tải file PDF trực tiếp thành công! Dung lượng: ${(downloadRes.rawBuffer.length / 1024).toFixed(1)} KB`);

    console.log('\n====================================================');
    console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ PHASE 4 ĐÃ VƯỢT QUA (PASSED)');
    console.log('====================================================');

  } finally {
    if (server) {
      server.close();
      console.log('🏁 Máy chủ thử nghiệm đã đóng kết nối.');
    }
  }
}

runTests().catch(err => {
  console.error('❌ KIỂM THỬ PHASE 4 THẤT BẠI:', err);
  process.exit(1);
});
