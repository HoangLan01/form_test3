require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH 
  ? path.resolve(process.cwd(), process.env.GOOGLE_CREDENTIALS_PATH)
  : path.join(process.cwd(), 'credentials.json');

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

let authClient = null;
let driveClient = null;
let sheetsClient = null;
let isInitialized = false;

/**
 * Check if Google Service Account credentials file exists
 */
function isConfigured() {
  return fs.existsSync(CREDENTIALS_PATH);
}

/**
 * Get Service Account credentials details if available
 */
function getCredentialsInfo() {
  if (!isConfigured()) return null;
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const json = JSON.parse(raw);
    return {
      clientEmail: json.client_email,
      projectId: json.project_id
    };
  } catch (err) {
    console.error('Lỗi khi đọc file credentials.json:', err.message);
    return null;
  }
}

/**
 * Initialize Google Auth Client
 */
function initAuth() {
  if (isInitialized) return authClient;

  if (!isConfigured()) {
    console.warn('⚠️ CHÚ Ý: Chưa tìm thấy file credentials.json! Hệ thống sẽ chạy ở chế độ dự phòng (Local Backup Mode).');
    return null;
  }

  try {
    authClient = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: SCOPES
    });

    driveClient = google.drive({ version: 'v3', auth: authClient });
    sheetsClient = google.sheets({ version: 'v4', auth: authClient });
    isInitialized = true;

    const creds = getCredentialsInfo();
    console.log(`🔐 Đã kết nối Google Service Account: ${creds?.clientEmail || 'Hợp lệ'}`);
    return authClient;
  } catch (err) {
    console.error('❌ Lỗi khi khởi tạo Google Auth:', err.message);
    return null;
  }
}

function getDriveClient() {
  if (!driveClient) initAuth();
  return driveClient;
}

function getSheetsClient() {
  if (!sheetsClient) initAuth();
  return sheetsClient;
}

module.exports = {
  isConfigured,
  getCredentialsInfo,
  initAuth,
  getDriveClient,
  getSheetsClient,
  CREDENTIALS_PATH
};
