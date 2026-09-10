const googleAuth = require('../config/googleAuth');

const HEADERS = [
  'Thời gian tiếp nhận',
  'Mã phiếu khảo sát',
  'Giới tính',
  'Độ tuổi',
  'Dân tộc',
  'Trình độ học vấn',
  'Nghề nghiệp',
  'Câu 1: Quan tâm chính sách',
  'Câu 2: Kênh theo dõi',
  'Câu 3: Phù hợp kênh TT',
  'Câu 4: Dự định góp ý',
  'Câu 5: Cảm nhận phiền hà/sách nhiễu',
  'Câu 6: Cảm nhận đưa tiền ngoài quy định',
  'Câu 7: Hình thức TTHC phù hợp',
  'Câu 8: Trải nghiệm thực tế (Có/Không)',
  'Câu 9: Điểm hài lòng trung bình (Thang 5)',
  'Câu 10: Mong muốn cải thiện',
  'Ý kiến đóng góp khác',
  'Điều tra viên',
  'Địa điểm khảo sát',
  'Link xem PDF trên Drive'
];

let isHeaderChecked = false;
let resolvedSheetName = null;

/**
 * Lấy tên tab đầu tiên của file Google Sheet tự động
 */
async function getActualSheetName(sheets, spreadsheetId) {
  if (resolvedSheetName) return resolvedSheetName;
  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title'
    });
    if (res.data.sheets && res.data.sheets.length > 0) {
      resolvedSheetName = res.data.sheets[0].properties.title;
      return resolvedSheetName;
    }
  } catch (err) {
    console.warn(`⚠️ [Google Sheets] Không thể lấy tên tab, dùng mặc định:`, err.message);
  }
  resolvedSheetName = process.env.GOOGLE_SHEET_NAME || 'Trang tính1';
  return resolvedSheetName;
}

/**
 * Đảm bảo file Sheet đã có dòng tiêu đề cột
 */
async function ensureHeaders(sheets, spreadsheetId, sheetName) {
  if (isHeaderChecked) return;
  try {
    const range = `'${sheetName}'!A1:U1`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    if (!res.data.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      // Sheet đang trống, ghi dòng Header
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [HEADERS]
        }
      });
      console.log(`📋 [Google Sheets] Đã tạo dòng Tiêu đề cột chuẩn cho file Sheet (${sheetName})`);
    }
    isHeaderChecked = true;
  } catch (err) {
    console.warn(`⚠️ [Google Sheets] Không thể kiểm tra header:`, err.message);
  }
}

/**
 * Tính điểm hài lòng trung bình của Câu 9 (Thang 1-5)
 */
function calculateAverageSatisfaction(q9Items) {
  if (!q9Items || q9Items.length === 0) return 'N/A';
  let totalScore = 0;
  let count = 0;
  q9Items.forEach(item => {
    const score = parseInt(item.score, 10);
    if (!isNaN(score) && score > 0) {
      totalScore += score;
      count += 1;
    }
  });
  return count > 0 ? (totalScore / count).toFixed(2) + '/5.0' : 'N/A';
}

/**
 * Ghi 1 dòng dữ liệu khảo sát vào Google Sheet
 * @param {Object} mappedData Dữ liệu khảo sát đã ánh xạ
 * @param {string} drivePdfLink Đường dẫn xem file PDF trên Drive
 * @returns {Promise<{ success: boolean, isMock: boolean }>}
 */
async function appendSurveyRow(mappedData, drivePdfLink) {
  const sheets = googleAuth.getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Trang tính1';

  // Chế độ Mock an toàn khi chưa cấu hình Google Sheet
  if (!sheets || !spreadsheetId || spreadsheetId === 'your_spreadsheet_id_here') {
    console.log(`ℹ️ [Google Sheets Mock] Đã ghi nhận dòng dữ liệu mã: ${mappedData.code}`);
    console.log(`   (Đang chạy chế độ an toàn do chưa cấu hình GOOGLE_SPREADSHEET_ID trong file .env)`);
    return {
      success: true,
      isMock: true
    };
  }

  try {
    const sheetName = await getActualSheetName(sheets, spreadsheetId);
    await ensureHeaders(sheets, spreadsheetId, sheetName);

    // Tóm tắt kết quả Câu 1
    const q1Summary = (mappedData.sections?.q1 || []).map(r => `${r.index}. ${r.label}`).join('; ');
    // Tóm tắt kết quả Câu 8
    const q8Summary = (mappedData.sections?.q8 || []).map(r => `${r.index}: ${r.value}`).join('; ');
    // Điểm TB Câu 9
    const avgScore = calculateAverageSatisfaction(mappedData.sections?.q9);

    const row = [
      mappedData.submitTime,
      mappedData.code,
      mappedData.personal.gender,
      mappedData.personal.age,
      mappedData.personal.ethnicity,
      mappedData.personal.education,
      mappedData.personal.job,
      q1Summary,
      mappedData.sections.q2,
      (mappedData.sections?.q3 || []).map(r => `${r.index}. ${r.label}`).join('; '),
      mappedData.sections.q4,
      mappedData.sections.q5,
      mappedData.sections.q6,
      (mappedData.sections?.q7 || []).map(r => `${r.index}. ${r.label}`).join('; '),
      q8Summary,
      avgScore,
      (mappedData.sections?.q10 || []).map(r => `${r.index}. ${r.label}`).join('; '),
      mappedData.sections.otherFeedback,
      mappedData.interviewer?.name || '',
      mappedData.interviewer?.location || '',
      drivePdfLink || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${sheetName}'!A:U`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row]
      }
    });

    console.log(`✅ [Google Sheets] Đã ghi thành công 1 dòng dữ liệu cho mã ${mappedData.code}`);

    return {
      success: true,
      isMock: false
    };
  } catch (err) {
    console.error('❌ [Google Sheets] Lỗi khi ghi dòng vào Sheet:', err.message);
    return {
      success: false,
      error: err.message,
      isMock: false
    };
  }
}

module.exports = {
  appendSurveyRow,
  HEADERS
};
