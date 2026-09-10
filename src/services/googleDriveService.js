const fs = require('fs');
const path = require('path');
const googleAuth = require('../config/googleAuth');

/**
 * Upload file PDF lên Google Drive của quản lý
 * - Hỗ trợ qua Google Apps Script Webhook (cho Gmail cá nhân tránh lỗi 0-quota)
 * - Hỗ trợ qua Google Service Account (cho Shared Drive / Workspace)
 * - Tự động fallback về link tải trực tiếp từ server nếu Drive chưa hỗ trợ
 * 
 * @param {string} filePath Đường dẫn file PDF trên server
 * @param {string} fileName Tên file lưu trên Drive
 * @param {string} [code] Mã phiếu khảo sát
 * @returns {Promise<{ success: boolean, fileId: string, webViewLink: string, isMock: boolean }>}
 */
async function uploadPdf(filePath, fileName, code) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
  const domain = process.env.DOMAIN || 'https://khaosat.phuongtungthien.vn';

  // Cách 1: Sử dụng Google Apps Script Webhook (Tối ưu nhất cho tài khoản Gmail cá nhân)
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: folderId,
          fileName: fileName,
          base64: base64Data
        })
      });

      const resData = await response.json();
      if (resData.success && resData.webViewLink) {
        console.log(`✅ [Google Drive GAS] Đã upload thành công file ${fileName} vào Drive cá nhân!`);
        return {
          success: true,
          fileId: resData.fileId,
          webViewLink: resData.webViewLink,
          isMock: false
        };
      }
    } catch (err) {
      console.warn(`⚠️ [Google Drive GAS] Lỗi khi upload qua Webhook:`, err.message);
    }
  }

  // Cách 2: Sử dụng Google Drive API trực tiếp (Dành cho Google Workspace / Shared Drive)
  const drive = googleAuth.getDriveClient();
  if (drive && folderId && folderId !== 'your_drive_folder_id_here') {
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
        fields: 'id, name, webViewLink',
        supportsAllDrives: true
      });

      const fileId = response.data.id;
      const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

      console.log(`✅ [Google Drive API] Đã upload thành công file ${fileName} (ID: ${fileId})`);

      return {
        success: true,
        fileId,
        webViewLink,
        isMock: false
      };
    } catch (err) {
      // Đối với Gmail cá nhân (@gmail.com), Google Drive API chặn Service Account tạo file vì quota = 0
      console.warn(`ℹ️ [Google Drive] Tài khoản Gmail cá nhân chưa kích hoạt Webhook Drive. Link xem PDF sẽ dùng link tải trực tiếp từ máy chủ.`);
    }
  }

  // Fallback: Sử dụng đường dẫn tải trực tiếp từ máy chủ của Phường
  const directDownloadLink = code 
    ? `${domain}/api/download-pdf/${encodeURIComponent(code)}`
    : `${domain}/api/download-pdf/${encodeURIComponent(fileName.replace('.pdf', ''))}`;

  return {
    success: true,
    fileId: null,
    webViewLink: directDownloadLink,
    isMock: false
  };
}

module.exports = {
  uploadPdf
};
