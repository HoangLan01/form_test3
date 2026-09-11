# Hệ thống Khảo sát SIPAS - UBND Phường Tùng Thiện

> Cổng thông tin tiếp nhận khảo sát trực tuyến Chỉ số hài lòng về sự phục vụ hành chính (SIPAS) tại UBND Phường Tùng Thiện - Thị xã Sơn Tây, TP. Hà Nội.  
> **Tên miền chính thức:** `https://khaosat.phuongtungthien.vn`  
> **Cổng ứng dụng trên VPS:** `Port 3005` (Reverse Proxy qua Nginx)

---

## 🛠️ SỔ TAY LỆNH VẬN HÀNH VPS (DÙNG NHIỀU NHẤT)

### 1. Cập nhật mã nguồn mới nhất từ GitHub
```bash
cd /var/www/sipas-survey
git pull origin main
pm2 restart sipas-survey-phuongtungthien --update-env
```

### 2. Reset dữ liệu & Đặt lại mã số thứ tự về 0001 (Trước ngày chạy chính thức)
```bash
cd /var/www/sipas-survey
npm run reset-data
pm2 restart sipas-survey-phuongtungthien
```
> **Lưu ý dọn dẹp Google Sheets & Drive:**
> - Vào Google Sheet xóa các dòng dữ liệu thử nghiệm (từ dòng 2 trở xuống).
> - Vào thư mục Google Drive `KhaoSat_SIPAS_PDF` xóa các file PDF thử nghiệm cũ.

### 3. Xem nhật ký hoạt động (Logs) thời gian thực
```bash
# Xem log của hệ thống khảo sát
pm2 logs sipas-survey-phuongtungthien

# Xem 100 dòng log gần nhất
pm2 logs sipas-survey-phuongtungthien --lines 100
```

### 4. Quản lý tiến trình PM2
```bash
# Xem danh sách ứng dụng và trạng thái RAM/CPU
pm2 list

# Khởi động lại ứng dụng
pm2 restart sipas-survey-phuongtungthien

# Dừng ứng dụng
pm2 stop sipas-survey-phuongtungthien
```

### 5. Quản trị Nginx Web Server
```bash
# Kiểm tra cú pháp cấu hình Nginx
sudo nginx -t

# Nạp lại cấu hình Nginx (không làm gián đoạn người dùng)
sudo systemctl reload nginx

# Xem trạng thái Nginx
sudo systemctl status nginx
```

---

## 🌟 Tính năng chính
- 📝 **Khảo sát trực tuyến SIPAS:** Giao diện tối ưu trải nghiệm người dùng, nền Trống đồng Đông Sơn mờ chìm, logo chính thức UBND Phường Tùng Thiện.
- 🏷️ **Sinh mã phiếu tự động:** Tự động tạo mã tiếp nhận điện tử `SIPAS-TT-YYYY-XXXX` có cơ chế Concurrency Lock chống trùng lặp tuyệt đối.
- ⚡ **Phản hồi siêu tốc (< 0.3s):** Trả về kết quả và link tải PDF tức thì, đồng bộ ngầm Google Drive & Sheet trong nền mà không làm nghẽn người dùng.
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
│   ├── index.html               # Giao diện Form khảo sát SIPAS
│   ├── logo.jpg                 # Logo chính thức UBND Phường Tùng Thiện
│   ├── trong_dong.png           # Họa tiết Trống đồng Đông Sơn
│   └── trong-dong.svg           # Vector Trống đồng Đông Sơn
├── src/
│   ├── config/
│   │   └── googleAuth.js        # Xác thực Google Cloud Service Account
│   ├── services/
│   │   ├── counterService.js    # Bộ đếm tự động tăng dần (SIPAS-TT-2026-XXXX)
│   │   ├── pdfService.js        # Render HTML -> Xuất PDF chuẩn A4 Times New Roman
│   │   ├── googleDriveService.js# Upload PDF vào Folder Drive (GAS Webhook)
│   │   └── googleSheetService.js# Ghi dòng dữ liệu 21 cột vào Google Sheet
│   ├── templates/
│   │   └── summary-pdf.html     # Template mẫu in tóm tắt chuẩn văn bản hành chính
│   ├── utils/
│   │   └── surveyMapper.js      # Ánh xạ dữ liệu sang văn bản tiếng Việt chi tiết
│   └── server.js                # Express API Server chính (Port 3005)
├── scripts/
│   ├── reset.js                 # Script reset dữ liệu & bộ đếm về 0001
│   └── generate_svg.js          # Script sinh vector Trống đồng
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

---

## 📖 Hướng dẫn Triển khai Production (Ubuntu Server)
Xem hướng dẫn chi tiết từng bước tại [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md).
