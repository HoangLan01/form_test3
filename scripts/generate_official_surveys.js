require('dotenv').config();
const counterService = require('../src/services/counterService');
const surveyMapper = require('../src/utils/surveyMapper');
const pdfService = require('../src/services/pdfService');
const googleDriveService = require('../src/services/googleDriveService');
const googleSheetService = require('../src/services/googleSheetService');

/**
 * Sinh dòng thời gian 10 phiếu trực tiếp từ thời điểm chạy lệnh
 * Tính lùi dần từ lúc bạn gõ lệnh (mỗi phiếu cách nhau ngẫu nhiên 4 - 8 phút)
 * để phiếu cuối cùng trùng với đúng lúc bạn chạy, không cần phân biệt ca kíp phức tạp.
 */
function generateTimeline(count = 10) {
  const timestamps = [];
  const now = new Date();

  // Bắt đầu từ phiếu cuối cùng (thời điểm gõ lệnh) lùi dần về trước
  let current = new Date(now.getTime());
  timestamps.unshift(new Date(current.getTime()));

  for (let i = 1; i < count; i++) {
    const stepMinutes = Math.floor(Math.random() * 5) + 4; // ngẫu nhiên 4 đến 8 phút
    current = new Date(current.getTime() - stepMinutes * 60 * 1000);
    timestamps.unshift(new Date(current.getTime()));
  }

  return timestamps;
}

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
  const edus = ['2', '3', '4', '5']; // THCS, THPT, Dạy nghề TC/CĐ, Đại học
  const edu = edus[Math.floor(Math.random() * edus.length)];
  const jobs = ['1', '3', '5', '6']; // Nghỉ hưu, Tự do, Doanh nghiệp tư nhân, Lĩnh vực công
  const job = jobs[Math.floor(Math.random() * jobs.length)];

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

  // Tạo dòng thời gian tăng dần tự nhiên bắt đầu từ sáng hôm nay (08h15)
  const timeline = generateTimeline(targetCount);

  for (let i = 1; i <= targetCount; i++) {
    const loopStart = Date.now();
    try {
      // 1. Lấy mã số tiếp theo liên tiếp từ bộ đếm
      const { code } = await counterService.getNextCode();

      // 2. Tạo dữ liệu khảo sát theo chuẩn (kèm mốc thời gian tự nhiên)
      const currentTimestamp = timeline[i - 1];
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

      // Nghỉ giãn cách nhỏ giữa các lần (1100ms khi bỏ qua PDF, 400ms khi có PDF)
      const delayMs = skipPdf ? 1100 : 400;
      if (i < targetCount) {
        await new Promise(r => setTimeout(r, delayMs));
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
  generateTimeline,
  generateSingleSurveyRaw,
  run
};

