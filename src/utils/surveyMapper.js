/**
 * Bản đồ câu hỏi và chuyển đổi dữ liệu khảo sát SIPAS sang văn bản tiếng Việt chi tiết
 */

const EDU_MAP = {
  '1': 'Tiểu học (cấp I)',
  '2': 'THCS (cấp II)',
  '3': 'THPT (cấp III)',
  '4': 'Dạy nghề TC/CĐ',
  '5': 'Đại học/ trên ĐH',
  '6': 'Khác'
};

const JOB_MAP = {
  '1': 'Nghỉ hưu',
  '2': 'Không đi làm (ở nhà)',
  '3': 'Làm công việc tự do (không ký HĐLĐ)',
  '4': 'Sinh viên',
  '5': 'Làm việc tại tổ chức, DN trong lĩnh vực tư',
  '6': 'Làm việc tại cơ quan, tổ chức, DN trong lĩnh vực công',
  '7': 'Khác'
};

const Q1_POLICIES = [
  'Chính sách phát triển kinh tế ở địa phương',
  'Chính sách khám, chữa bệnh ở địa phương',
  'Chính sách giáo dục phổ thông ở địa phương',
  'Chính sách nước sinh hoạt ở địa phương',
  'Chính sách điện sinh hoạt ở địa phương',
  'Chính sách trật tự, an toàn xã hội ở địa phương',
  'Chính sách giao thông đường bộ ở địa phương',
  'Chính sách an sinh, xã hội ở địa phương',
  'Chính sách cải cách hành chính ở địa phương'
];

const Q1_LEVELS = {
  '1': 'Không quan tâm theo dõi',
  '2': 'Khá quan tâm theo dõi',
  '3': 'Quan tâm theo dõi',
  '4': 'Rất quan tâm theo dõi'
};

const Q2_CHANNELS = {
  '1': 'Qua loa phát thanh phường',
  '2': 'Qua họp, sinh hoạt, thông báo tại khu dân cư',
  '3': 'Qua chính quyền, công chức',
  '4': 'Qua người thân, bạn bè',
  '5': 'Qua đài, ti vi, báo chí',
  '6': 'Qua mạng internet (Trang TTĐT, Zalo, Facebook...)',
  '7': 'Qua hình thức khác'
};

const Q3_ITEMS = [
  'Qua loa phát thanh phường',
  'Qua họp, sinh hoạt, thông báo tại khu dân cư',
  'Qua chính quyền, công chức',
  'Qua người thân, bạn bè',
  'Qua đài, ti vi, báo chí',
  'Qua mạng internet (Trang TTĐT, báo điện tử, zalo, facebook...)',
  'Qua hình thức khác'
];

const Q3_LEVELS = {
  '1': 'Không phù hợp',
  '2': 'Khá phù hợp',
  '3': 'Phù hợp',
  '4': 'Rất phù hợp'
};

const Q4_OPTIONS = {
  '1': 'Sẽ tham gia, nếu được xin ý kiến theo bất kỳ hình thức nào',
  '2': 'Sẽ tham gia, nếu gửi phiếu đến nhà, cơ quan',
  '3': 'Sẽ tham gia, nếu xin ý kiến tại cuộc họp cư dân',
  '4': 'Sẽ tham gia, nếu xin ý kiến trực tuyến'
};

const Q5_OPTIONS = {
  '1': 'Không có công chức nào gây phiền hà, sách nhiễu cho người dân',
  '2': 'Có một số công chức gây phiền hà, sách nhiễu cho người dân',
  '3': 'Có nhiều công chức gây phiền hà, sách nhiễu cho người dân'
};

const Q6_OPTIONS = {
  '1': 'Không có người dân nào phải đưa tiền ngoài quy định cho công chức',
  '2': 'Có một số người dân phải đưa tiền ngoài quy định cho công chức',
  '3': 'Có nhiều người dân phải đưa tiền ngoài quy định cho công chức'
};

const Q7_ITEMS = [
  'Nộp và nhận kết quả trực tiếp tại cơ quan nhà nước',
  'Nộp và nhận kết quả trực tuyến toàn trình',
  'Nộp và nhận kết quả trực tuyến một phần'
];

const Q8_ITEMS = [
  'Có người thân đi học phổ thông (trong 3 năm trở lại đây)',
  'Khám, chữa bệnh tại BV/phòng khám đa khoa tuyến thành phố, phường',
  'Giải quyết TTHC tại Trung tâm Phục vụ HCC thành phố',
  'Giải quyết TTHC tại Điểm phục vụ HCC tại phường',
  'Hỏi chính quyền, công chức về chính sách, TTHC',
  'Nêu ý kiến đánh giá về thực hiện chính sách, TTHC',
  'Nêu ý kiến phản ánh, kiến nghị về chính sách, TTHC'
];

const Q9_ITEMS = [
  // I.A
  'Chính quyền cung cấp, giải thích thông tin chính sách nhiều hình thức, dễ tìm, dễ thấy',
  'Chính quyền cung cấp thông tin chính sách đầy đủ, dễ hiểu',
  // I.B
  'Chính quyền tổ chức nhiều hình thức để người dân dễ góp ý xây dựng chính sách',
  'Chính quyền tổ chức nhiều hình thức để người dân phản hồi đánh giá chính sách',
  // I.C
  'Chính quyền thực hiện tốt chính sách phát triển kinh tế',
  'Chính quyền thực hiện tốt chính sách khám chữa bệnh',
  'Chính quyền thực hiện tốt chính sách giáo dục phổ thông',
  'Chính quyền thực hiện tốt chính sách trật tự, an toàn xã hội',
  'Chính quyền thực hiện tốt chính sách giao thông đường bộ',
  'Chính quyền thực hiện tốt chính sách điện sinh hoạt',
  'Chính quyền thực hiện tốt chính sách nước sinh hoạt',
  'Chính quyền thực hiện tốt chính sách an sinh xã hội',
  'Chính quyền thực hiện tốt chính sách cải cách hành chính',
  // I.D
  'Kinh tế gia đình của người dân tốt hơn',
  'Kinh tế - xã hội địa phương tốt hơn',
  'Bệnh viện công lập khám chữa bệnh tốt hơn',
  'Trường phổ thông công lập dạy học tốt hơn',
  'Trật tự, an toàn xã hội tốt hơn',
  'Đường bộ, giao thông tốt hơn',
  'Điện sinh hoạt tốt hơn',
  'Nước sinh hoạt tốt hơn',
  'An sinh xã hội tốt hơn',
  'Cơ quan hành chính, cán bộ công chức có năng lực và thực thi công vụ tốt hơn',
  // II.A
  'Điểm phục vụ HCC có biển hiệu, hướng dẫn rõ ràng, dễ tìm',
  'Điểm phục vụ HCC có đủ ghế ngồi chờ và bàn viết',
  'Điểm phục vụ HCC có trang thiết bị đầy đủ, chất lượng tốt',
  // II.B
  'Quy định TTHC được niêm yết công khai, dễ thấy, dễ đọc',
  'Công chức yêu cầu nộp hồ sơ đúng quy định',
  'Công chức yêu cầu đóng phí, lệ phí đúng quy định',
  'Thời hạn giải quyết TTHC đúng quy định',
  // II.C
  'Công chức có thái độ lịch sự, tôn trọng người dân',
  'Công chức hướng dẫn hồ sơ dễ hiểu, đầy đủ (1 lần hướng dẫn)',
  'Công chức tuân thủ đúng quy định trong giải quyết TTHC',
  // II.D
  'Kết quả giải quyết TTHC được trả đúng hẹn',
  'Kết quả TTHC có thông tin đầy đủ, chính xác',
  'Kết quả TTHC đảm bảo tính công bằng',
  // II.E
  'Bố trí hình thức tiếp nhận phản ánh, kiến nghị dễ dàng',
  'Tiếp nhận, xử lý phản ánh, kiến nghị đúng quy định',
  'Thông báo kết quả xử lý phản ánh, kiến nghị kịp thời'
];

const SATISFACTION_LEVELS = {
  '1': 'Rất không hài lòng (1đ)',
  '2': 'Không hài lòng (2đ)',
  '3': 'Bình thường (3đ)',
  '4': 'Hài lòng (4đ)',
  '5': 'Rất hài lòng (5đ)'
};

const Q10_ITEMS = [
  'Nâng cao tính công khai, minh bạch trong cung cấp thông tin',
  'Tăng cường trách nhiệm giải trình của chính quyền',
  'Mở rộng cơ hội tham gia giám sát của người dân',
  'Nâng cao hiệu lực, hiệu quả hoạt động chính quyền địa phương',
  'Tăng cường cơ sở vật chất, trang thiết bị phục vụ giải quyết công việc',
  'Nâng cao năng lực cán bộ, công chức, viên chức',
  'Nâng cao tinh thần, thái độ phục vụ của cán bộ, công chức',
  'Tăng cường ứng dụng CNTT, chuyển đổi số',
  'Nâng cao chất lượng cung ứng Dịch vụ công trực tuyến',
  'Nâng cao chất lượng tiếp nhận, giải quyết góp ý, kiến nghị'
];

const Q10_LEVELS = {
  '1': 'Không mong muốn',
  '2': 'Khá mong muốn',
  '3': 'Mong muốn',
  '4': 'Rất mong muốn'
};

/**
 * Ánh xạ toàn bộ dữ liệu thô gửi lên thành object có nhãn text đầy đủ
 * @param {Object} raw 
 * @param {string} code Mã phiếu (ví dụ SIPAS-TT-2026-0001)
 * @returns {Object} Dữ liệu đã xử lý
 */
function mapSurveyData(raw, code) {
  const submitTime = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Xử lý học vấn
  let education = EDU_MAP[raw.edu] || raw.edu || 'Chưa chọn';
  if (raw.edu === '6' && raw.edu_other) {
    education = `Khác (${raw.edu_other})`;
  }

  // Xử lý dân tộc
  let ethnicity = raw.ethnicity || 'Chưa chọn';
  if (raw.ethnicity === 'Khác' && raw.ethnicity_other) {
    ethnicity = `Khác (${raw.ethnicity_other})`;
  }

  // Xử lý nghề nghiệp
  let job = JOB_MAP[raw.job] || raw.job || 'Chưa chọn';
  if (raw.job === '7' && raw.job_other) {
    job = `Khác (${raw.job_other})`;
  }

  // Xử lý Câu 1 (Quan tâm chính sách)
  const q1Results = Q1_POLICIES.map((policy, idx) => {
    const val = raw[`q1_${idx + 1}`];
    return {
      index: idx + 1,
      policy,
      score: val || '',
      label: Q1_LEVELS[val] || 'Chưa chọn'
    };
  });

  // Xử lý Câu 2 (Kênh theo dõi - chọn nhiều)
  let q2Values = [];
  if (Array.isArray(raw.q2)) {
    q2Values = raw.q2;
  } else if (raw.q2) {
    q2Values = [raw.q2];
  }
  const q2Labels = q2Values.map(v => {
    if (v === '7' && raw.q2_other) return `Khác: ${raw.q2_other}`;
    return Q2_CHANNELS[v] || v;
  });

  // Xử lý Câu 3 (Mức độ phù hợp kênh thông tin)
  const q3Results = Q3_ITEMS.map((item, idx) => {
    const val = raw[`q3_${idx + 1}`];
    return {
      index: idx + 1,
      item,
      score: val || '',
      label: Q3_LEVELS[val] || 'Chưa chọn'
    };
  });

  // Xử lý Câu 4
  const q4Label = Q4_OPTIONS[raw.q4] || raw.q4 || 'Chưa chọn';

  // Xử lý Câu 5, 6
  const q5Label = Q5_OPTIONS[raw.q5] || raw.q5 || 'Chưa chọn';
  const q6Label = Q6_OPTIONS[raw.q6] || raw.q6 || 'Chưa chọn';

  // Xử lý Câu 7 (Hình thức nộp/nhận TTHC)
  const q7Results = Q7_ITEMS.map((item, idx) => {
    const val = raw[`q7_${idx + 1}`];
    return {
      index: idx + 1,
      item,
      score: val || '',
      label: Q3_LEVELS[val] || 'Chưa chọn'
    };
  });

  // Xử lý Câu 8 (Trải nghiệm Có/Không)
  const q8Results = Q8_ITEMS.map((item, idx) => {
    const val = raw[`q8_${idx + 1}`];
    return {
      index: idx + 1,
      item,
      value: val === '1' ? 'Có' : val === '2' ? 'Không' : 'Chưa chọn'
    };
  });

  // Xử lý Câu 9 (Đánh giá mức độ hài lòng 39 tiêu chí)
  const q9Results = Q9_ITEMS.map((item, idx) => {
    const val = raw[`q9_sat_${idx + 1}`];
    return {
      index: idx + 1,
      item,
      score: val || '',
      label: SATISFACTION_LEVELS[val] || 'Chưa chọn'
    };
  });

  // Xử lý Câu 10 (Mong muốn cải thiện 10 nội dung)
  const q10Results = Q10_ITEMS.map((item, idx) => {
    const val = raw[`q10_${idx + 1}`];
    return {
      index: idx + 1,
      item,
      score: val || '',
      label: Q10_LEVELS[val] || 'Chưa chọn'
    };
  });

  return {
    code,
    submitTime,
    personal: {
      gender: raw.gender || 'Chưa chọn',
      ethnicity,
      age: raw.age ? `${raw.age} tuổi` : 'Chưa chọn',
      education,
      job
    },
    interviewer: {
      name: raw.interviewer_name || '',
      location: raw.survey_location || '',
      date: raw.survey_date || ''
    },
    sections: {
      q1: q1Results,
      q2: q2Labels.length > 0 ? q2Labels.join(', ') : 'Không chọn',
      q3: q3Results,
      q4: q4Label,
      q5: q5Label,
      q6: q6Label,
      q7: q7Results,
      q8: q8Results,
      q9: q9Results,
      q10: q10Results,
      otherFeedback: raw.other_feedback || 'Không có'
    },
    raw
  };
}

module.exports = {
  mapSurveyData,
  EDU_MAP,
  JOB_MAP,
  Q1_POLICIES,
  Q1_LEVELS,
  Q2_CHANNELS,
  Q3_ITEMS,
  Q3_LEVELS,
  Q4_OPTIONS,
  Q5_OPTIONS,
  Q6_OPTIONS,
  Q7_ITEMS,
  Q8_ITEMS,
  Q9_ITEMS,
  SATISFACTION_LEVELS,
  Q10_ITEMS,
  Q10_LEVELS
};
