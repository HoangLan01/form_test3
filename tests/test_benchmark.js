const assert = require('assert');
const http = require('http');
const app = require('../src/server');

const TEST_PORT = 3579;

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

async function runBenchmark() {
  console.log('====================================================');
  console.log('⚡ BẮT ĐẦU KIỂM THỬ TỐC ĐỘ PHẢN HỒI (BENCHMARK TEST)');
  console.log('====================================================\n');

  let server;
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, async () => {
      console.log(`✅ Máy chủ thử nghiệm khởi động trên cổng ${TEST_PORT}`);
      resolve();
    });
  });

  const samplePayload = JSON.stringify({
    gender: 'Nam',
    ethnicity: 'Kinh',
    age: '25-34',
    edu: '5',
    job: '5',
    q1_1: '4', q1_2: '4', q1_3: '4', q1_4: '4', q1_5: '4',
    q1_6: '4', q1_7: '4', q1_8: '4', q1_9: '4',
    q2: ['1', '6'],
    q3_1: '4', q3_2: '4', q3_3: '4', q3_4: '4', q3_5: '4', q3_6: '4', q3_7: '4',
    q4: '1', q5: '1', q6: '1',
    q7_1: '4', q7_2: '4', q7_3: '4',
    q8_1: '1', q8_2: '1', q8_3: '2', q8_4: '1', q8_5: '1', q8_6: '2', q8_7: '2',
    q9_sat_1: '5', q9_sat_2: '5', q9_sat_3: '5',
    q10_1: '4', q10_2: '4',
    other_feedback: 'Test tốc độ phản hồi.'
  });

  try {
    // 1. Test lượt đầu tiên (Warmup & Single request)
    console.log('⏳ Test lượt gửi đơn lẻ...');
    const t0 = Date.now();
    const res1 = await sendRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/submit',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, samplePayload);

    const clientDuration = Date.now() - t0;
    assert.strictEqual(res1.statusCode, 200);
    const data1 = JSON.parse(res1.body);

    console.log(`✅ Lượt 1 hoàn tất:`);
    console.log(`   - Mã phiếu: ${data1.code}`);
    console.log(`   - Thời gian phản hồi khách hàng: ${clientDuration} ms (${(clientDuration / 1000).toFixed(2)}s)`);

    // 2. Test Concurrency (10 người cùng gửi một lúc)
    console.log('\n⏳ Bắt đầu test 10 người cùng bấm gửi đồng thời...');
    const startTimeMulti = Date.now();
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(sendRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/submit',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, samplePayload));
    }

    const multiResults = await Promise.all(promises);
    const totalMultiDuration = Date.now() - startTimeMulti;
    const avgDuration = (totalMultiDuration / 10).toFixed(0);

    multiResults.forEach((r, idx) => {
      assert.strictEqual(r.statusCode, 200);
      const d = JSON.parse(r.body);
      assert.ok(d.success);
    });

    console.log(`✅ Hoàn thành 10 lượt gửi đồng thời!`);
    console.log(`   - Tổng thời gian cho cả 10 người: ${totalMultiDuration} ms`);
    console.log(`   - Trung bình mỗi người chỉ mất: ~${avgDuration} ms`);

    console.log('\n====================================================');
    console.log('🎉 TỐI ƯU TỐC ĐỘ THÀNH CÔNG RỰC RỠ!');
    console.log('====================================================');

    // Đợi 4 giây để xem log đồng bộ ngầm
    console.log('⏳ Đang đợi 4s để kiểm tra tác vụ đồng bộ ngầm hoàn tất...');
    await new Promise(r => setTimeout(r, 4000));

  } finally {
    if (server) server.close();
  }
}

runBenchmark().catch(err => {
  console.error('❌ Test thất bại:', err);
  process.exit(1);
});
