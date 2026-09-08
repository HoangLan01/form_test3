const fs = require('fs');
const path = require('path');
const googleAuth = require('../config/googleAuth');

/**
 * Upload file PDF lên Thư mục Google Drive của quản lý
 * @param {string} filePath Đường dẫn file PDF trên server
 * @param {string} fileName Tên file lưu trên Drive
 * @returns {Promise<{ success: boolean, fileId: string, webViewLink: string, isMock: boolean }>}
 */
async function uploadPdf(filePath, fileName) {
  const drive = googleAuth.getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Nếu chưa cấu hình Google Service Account hoặc chưa điền Folder ID -> Mock/Fallback an toàn
  if (!drive || !folderId || folderId === 'your_drive_folder_id_here') {
    const mockFileId = `mock_drive_file_${Date.now()}`;
    const mockViewLink = `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`;
    
    console.log(`ℹ️ [Google Drive Mock] Đã ghi nhận upload file PDF: ${fileName}`);
    console.log(`   (Đang chạy chế độ an toàn do chưa cấu hình GOOGLE_DRIVE_FOLDER_ID trong file .env)`);

    return {
      success: true,
      fileId: mockFileId,
      webViewLink: mockViewLink,
      isMock: true
    };
  }

  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

    console.log(`✅ [Google Drive] Đã upload thành công file ${fileName} (ID: ${fileId})`);

    return {
      success: true,
      fileId,
      webViewLink,
      isMock: false
    };
  } catch (err) {
    console.error('❌ [Google Drive] Lỗi khi upload file PDF:', err.message);
    // Vẫn trả về fallback để luồng gửi khảo sát không bị gián đoạn
    return {
      success: false,
      error: err.message,
      fileId: null,
      webViewLink: 'Chưa đồng bộ lên Drive',
      isMock: false
    };
  }
}

module.exports = {
  uploadPdf
};
