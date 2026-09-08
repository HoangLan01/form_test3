# Hệ thống Khảo sát SIPAS - UBND Phường Tùng Thiện

> Cổng thông tin tiếp nhận khảo sát trực tuyến Chỉ số hài lòng về sự phục vụ hành chính (SIPAS) tại UBND Phường Tùng Thiện - Thị xã Sơn Tây, TP. Hà Nội.  
> **Tên miền:** `khaosat.phuongtungthien.vn`

---

## 🌟 Tính năng chính
- 📝 **Khảo sát trực tuyến SIPAS:** Giao diện tối ưu trải nghiệm người dùng, hỗ trợ đầy đủ các phần khảo sát theo chuẩn Bộ Nội vụ & UBND Thành phố.
- 🏷️ **Sinh mã phiếu tự động:** Tự động tạo mã tiếp nhận điện tử `SIPAS-TT-YYYY-XXXX` có cơ chế Concurrency Lock chống trùng lặp tuyệt đối.
- 📄 **Xuất file PDF tóm tắt:** Tự động tạo file PDF tóm tắt kết quả theo chuẩn thể thức văn bản hành chính Việt Nam (Font Times New Roman, khổ A4).
- ☁️ **Đồng bộ Google Workspace:**
  - Tự động tải file PDF lên **Google Drive** của người quản lý.
  - Tự động ghi 21 cột dữ liệu chi tiết vào **Google Sheet** (kèm link PDF).
- 📥 **Tải trực tiếp PDF:** Người dân có thể tải ngay phiếu tóm tắt về máy sau khi hoàn thành.
- 🐧 **Sẵn sàng cho Production:** Đã đóng gói cấu hình PM2 (`ecosystem.config.js`) và Nginx (`nginx.conf`) cho server Ubuntu.

---

## 📁 Cấu trúc dự án
```text
form_test3/
├── public/
│   └── index.html               # Giao diện Form khảo sát SIPAS
├── src/
│   ├── config/
│   │   └── googleAuth.js        # Xác thực Google Cloud Service Account
│   ├── services/
│   │   ├── counterService.js    # Bộ đếm tự động tăng dần (SIPAS-TT-2026-XXXX)
│   │   ├── pdfService.js        # Render HTML -> Xuất PDF chuẩn A4 Times New Roman
│   │   ├── googleDriveService.js# Upload PDF vào Folder Drive
│   │   └── googleSheetService.js# Ghi dòng dữ liệu 21 cột vào Google Sheet
│   ├── templates/
│   │   └── summary-pdf.html     # Template mẫu in tóm tắt chuẩn văn bản hành chính
│   ├── utils/
│   │   └── surveyMapper.js      # Ánh xạ dữ liệu sang văn bản tiếng Việt chi tiết
│   └── server.js                # Express API Server chính
├── tests/                       # Bộ kiểm thử tự động theo từng giai đoạn
├── ecosystem.config.js          # Cấu hình PM2
├── nginx.conf                   # Cấu hình Nginx reverse proxy
├── DEPLOY_GUIDE.md              # Hướng dẫn chi tiết triển khai từ A-Z
└── package.json
```

---

## 🚀 Hướng dẫn cài đặt & Chạy cục bộ

1. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo file `.env` từ `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Chạy kiểm thử:**
   ```bash
   npm run test:phase1    # Test Counter & Mapper
   npm run test:phase2    # Test PDF Generator
   npm run test:phase3    # Test Google Services
   npm run test:phase4    # Test End-to-End Pipeline
   ```

4. **Khởi động server:**
   ```bash
   npm start
   ```
   Truy cập `http://localhost:3000`.

---

## 📖 Hướng dẫn Triển khai Production (Ubuntu Server)
Xem hướng dẫn chi tiết từng bước tại [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md).
