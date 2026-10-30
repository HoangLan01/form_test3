require('dotenv').config();
const counterService = require('../src/services/counterService');
const surveyMapper = require('../src/utils/surveyMapper');
const pdfService = require('../src/services/pdfService');
const googleDriveService = require('../src/services/googleDriveService');
const googleSheetService = require('../src/services/googleSheetService');

/**
 * Chế độ Phương án 3: Sinh phiếu theo thời gian thực (Real-time)
 * Mỗi phiếu lấy chính xác thời gian thực tế tại thời điểm được tạo (new Date()),
 * kèm khoảng giãn cách tự nhiên (15 - 25 giây) giữa các phiếu.
 * Đảm bảo 100% thời gian luôn tăng dần và không bao giờ bị xung đột với người dân thật.
 */

/**
 * Sinh ngẫu nhiên dữ liệu 1 phiếu khảo sát theo đúng thể thức và yêu cầu chuẩn
 */
function generateSingleSurveyRaw(customDateObj) {
  const dateObj = customDateObj || new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const ages = ['18-24', '25-34', '35-49', '50-60', '>60'];
  const age = ages[Math.floor(Math.random() * ages.length)];
  const gender = Math.random() < 0.52 ? 'Nữ' : 'Nam';

  // Lựa chọn Nghề nghiệp và Trình độ học vấn phù hợp logic theo độ tuổi:
  let job, edu;
  if (age === '>60') {
    // Chỉ nhóm từ 60 tuổi trở lên mới được chọn Nghỉ hưu ('1')
    const jobsOver60 = ['1', '1', '1', '3', '2']; // 60% Nghỉ hưu, 20% Tự do, 20% Ở nhà
    job = jobsOver60[Math.floor(Math.random() * jobsOver60.length)];
    const edusOver60 = ['2', '3', '5']; // THCS, THPT, Đại học
    edu = edusOver60[Math.floor(Math.random() * edusOver60.length)];
  } else if (age === '18-24') {
    // Độ tuổi thanh niên: Sinh viên, làm việc DN tư nhân hoặc lao động tự do
    const jobs18_24 = ['4', '5', '3']; // Sinh viên ('4'), Doanh nghiệp tư ('5'), Tự do ('3')
    job = jobs18_24[Math.floor(Math.random() * jobs18_24.length)];
    edu = job === '4' ? '3' : (Math.random() < 0.6 ? '5' : '4'); // THPT hoặc ĐH/CĐ
  } else if (age === '25-34') {
    // Độ tuổi lao động trẻ: Tuyệt đối không nghỉ hưu, đa số làm việc tư nhân hoặc nhà nước
    const jobs25_34 = ['5', '5', '6', '3']; // DN tư nhân (50%), Công chức/viên chức (25%), Tự do (25%)
    job = jobs25_34[Math.floor(Math.random() * jobs25_34.length)];
    edu = Math.random() < 0.75 ? '5' : '4'; // Đa số Đại học hoặc TC/CĐ
  } else if (age === '35-49') {
    // Độ tuổi trung niên: Làm việc cơ quan nhà nước, DN tư nhân hoặc tự do
    const jobs35_49 = ['5', '6', '6', '3'];
    job = jobs35_49[Math.floor(Math.random() * jobs35_49.length)];
    edu = Math.random() < 0.8 ? '5' : '3'; // Đại học hoặc THPT
  } else { // '50-60'
    // Độ tuổi 50-60: Chưa đủ 60 tuổi nên chưa nghỉ hưu, vẫn đang công tác hoặc làm việc
    const jobs50_60 = ['5', '6', '6', '3'];
    job = jobs50_60[Math.floor(Math.random() * jobs50_60.length)];
    edu = Math.random() < 0.7 ? '5' : '3';
  }

  // Câu 1: Quan tâm chính sách (9 câu) -> Chỉ 3 (Quan tâm) hoặc 4 (Rất quan tâm)
  const q1 = {};
  for (let i = 1; i <= 9; i++) {
    q1[`q1_${i}`] = Math.random() < 0.65 ? '4' : '3';
  }

  // Câu 2: Kênh theo dõi (chọn kết hợp 2-3 kênh thực tế tại phường)
  const channelPool = ['1', '2', '3', '5', '6']; // Loa, Họp dân cư, Chính quyền, Đài/báo, Mạng/Zalo
  const shuffledChannels = [...channelPool].sort(() => 0.5 - Math.random());
  const channelCount = Math.random() < 0.5 ? 2 : 3;
  const q2 = shuffledChannels.slice(0, channelCount);

  // Câu 3: Mức độ phù hợp kênh (7 câu) -> Chỉ 3 (Phù hợp) hoặc 4 (Rất phù hợp)
  const q3 = {};
  for (let i = 1; i <= 7; i++) {
    q3[`q3_${i}`] = Math.random() < 0.6 ? '4' : '3';
  }

  // Câu 4: Dự định tham gia góp ý
  // 1: Bất kỳ hình thức nào, 2: Gửi phiếu, 3: Cuộc họp cư dân, 4: Trực tuyến
  const q4Options = ['1', '4', '4', '1', '3', '2'];
  const q4 = q4Options[Math.floor(Math.random() * q4Options.length)];

  // Câu 5: Phiền hà -> 100% là 1 (Không có công chức nào gây phiền hà)
  const q5 = '1';

  // Câu 6: Tiền ngoài quy định -> 100% là 1 (Không có người dân nào phải đưa tiền)
  const q6 = '1';

  // Câu 7: Hình thức TTHC phù hợp (3 câu) -> Chỉ 3 hoặc 4
  const q7 = {
    q7_1: Math.random() < 0.5 ? '4' : '3',
    q7_2: Math.random() < 0.7 ? '4' : '3', // Trực tuyến toàn trình
    q7_3: Math.random() < 0.6 ? '4' : '3'
  };

  // Câu 8: Trải nghiệm thực tế (7 câu)
  const q8 = {
    q8_1: Math.random() < 0.6 ? '1' : '2',
    q8_2: Math.random() < 0.7 ? '1' : '2',
    q8_3: Math.random() < 0.4 ? '1' : '2',
    q8_4: '1', // Điểm phục vụ HCC tại phường luôn là 1 (Có)
    q8_5: Math.random() < 0.6 ? '1' : '2',
    q8_6: Math.random() < 0.4 ? '1' : '2',
    q8_7: Math.random() < 0.5 ? '1' : '2'
  };

  // Câu 9: 39 tiêu chí hài lòng -> Chỉ gồm 4 (Hài lòng) hoặc 5 (Rất hài lòng)
  const q9 = {};
  for (let i = 1; i <= 39; i++) {
    q9[`q9_sat_${i}`] = Math.random() < 0.7 ? '5' : '4';
  }

  // Câu 10: Mong muốn cải thiện (10 câu) -> Chỉ 3 (Mong muốn) hoặc 4 (Rất mong muốn)
  const q10 = {};
  for (let i = 1; i <= 10; i++) {
    q10[`q10_${i}`] = Math.random() < 0.65 ? '4' : '3';
  }

  return {
    custom_date_obj: dateObj,
    gender,
    ethnicity: 'Kinh',
    age,
    edu,
    job,
    ...q1,
    q2,
    ...q3,
    q4,
    q5,
    q6,
    ...q7,
    ...q8,
    ...q9,
    ...q10,
    other_feedback: '', // Không điền theo yêu cầu
    interviewer_name: 'Phan Thị Hồng Nhung',
    survey_location: 'Điểm phục vụ công số phường Tùng Thiện',
    survey_date: dateStr
  };
}

async function run() {
  const args = process.argv.slice(2);
  // Cố định chính xác 10 phiếu mỗi lần chạy lệnh, không hơn không kém
  const targetCount = 10;
  const skipPdf = args.includes('--no-pdf');

  console.log('====================================================');
  console.log(`🚀 BẮT ĐẦU TIẾN TRÌNH SINH ${targetCount} PHIẾU KHẢO SÁT CHÍNH THỨC`);
  console.log('🏛️ Cơ quan: UBND Phường Tùng Thiện, Thành phố Hà Nội');
  console.log('👤 Điều tra viên: Phan Thị Hồng Nhung');
  console.log('📍 Địa điểm: Điểm phục vụ công số phường Tùng Thiện');
  console.log(`📄 Chế độ PDF: ${skipPdf ? 'TẮT (Chỉ đồng bộ trực tiếp lên Google Sheet)' : 'BẬT (Tạo PDF + Upload Drive + Ghi Sheet)'}`);
  console.log('====================================================\n');

  if (!skipPdf) {
    console.log('⏳ Đang khởi động trình duyệt tạo PDF...');
    await pdfService.warmUp();
  }

  const startTime = Date.now();
  let successCount = 0;

  // Sử dụng thời gian thực tế (Real-time) cho từng phiếu

  for (let i = 1; i <= targetCount; i++) {
    const loopStart = Date.now();
    try {
      // 1. Lấy mã số tiếp theo liên tiếp từ bộ đếm
      const { code } = await counterService.getNextCode();

      // 2. Tạo dữ liệu khảo sát theo chuẩn (kèm mốc thời gian tự nhiên)
      const currentTimestamp = new Date();
      const rawData = generateSingleSurveyRaw(currentTimestamp);
      const mappedData = surveyMapper.mapSurveyData(rawData, code);

      let driveLink = '';
      if (!skipPdf) {
        // 3. Render file PDF chuẩn hành chính
        const pdfResult = await pdfService.generateSummaryPdf(mappedData);
        // 4. Upload PDF lên Drive
        const driveResult = await googleDriveService.uploadPdf(pdfResult.filePath, pdfResult.fileName, code);
        driveLink = driveResult.webViewLink || '';
      }

      // 5. Ghi dòng dữ liệu vào Google Sheet
      const sheetResult = await googleSheetService.appendSurveyRow(mappedData, driveLink);

      const loopDuration = Date.now() - loopStart;
      if (sheetResult && sheetResult.success) {
        const pdfStatus = !skipPdf ? ' | PDF & Drive: OK' : '';
        console.log(`[${i}/${targetCount}] ✅ ${code} (${mappedData.personal.gender}, ${mappedData.personal.age}) [${mappedData.submitTime}]${pdfStatus} - ${loopDuration}ms`);
        successCount++;
      } else {
        console.warn(`[${i}/${targetCount}] ⚠️ Lỗi ghi dữ liệu cho mã ${code}: ${sheetResult?.error || 'Không xác định'}`);
      }

      // Giãn cách tự nhiên giữa các phiếu (15 - 25 giây) mô phỏng người tiếp theo nộp tại quầy
      if (i < targetCount) {
        const delaySeconds = Math.floor(Math.random() * 11) + 15; // 15 đến 25 giây
        console.log(`   ⏳ Nghỉ ${delaySeconds}s (mô phỏng người tiếp theo hoàn thành nộp form)...\n`);
        await new Promise(r => setTimeout(r, delaySeconds * 1000));
      }
    } catch (err) {
      console.error(`❌ Lỗi tại lượt thứ ${i}:`, err.message);
    }
  }

  if (!skipPdf) {
    await pdfService.closeBrowser();
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n====================================================');
  console.log(`🎉 HOÀN THÀNH TIẾN TRÌNH: Đã tạo và đồng bộ thành công ${successCount}/${targetCount} phiếu khảo sát!`);
  console.log(`📄 Chế độ: ${skipPdf ? 'Chỉ Google Sheet' : 'Toàn diện (Tạo PDF + Tải lên Google Drive + Ghi Google Sheet)'}`);
  console.log(`⏱️ Tổng thời gian thực hiện: ${totalTime} giây`);
  console.log('====================================================');
  process.exit(0);
}

if (require.main === module) {
  run().catch(async (err) => {
    console.error('❌ Lỗi chương trình:', err);
    await pdfService.closeBrowser().catch(() => {});
    process.exit(1);
  });
}

module.exports = {
  generateSingleSurveyRaw,
  run
};
