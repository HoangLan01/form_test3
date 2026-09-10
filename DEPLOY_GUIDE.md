# HƯỚNG DẪN TRIỂN KHAI VẬN HÀNH TỪ A-Z (PRODUCTION)
## HỆ THỐNG KHẢO SÁT SIPAS - UBND PHƯỜNG TÙNG THIỆN
**Tên miền:** `khaosat.phuongtungthien.vn` | **Hệ điều hành Server:** Ubuntu Linux

---

## MỤC LỤC
1. [Bước 1: Thiết lập Google Service Account (Google Cloud)](#bước-1-thiết-lập-google-service-account)
2. [Bước 2: Cấp quyền Thư mục Drive & File Sheet trên Gmail cá nhân](#bước-2-cấp-quyền-drive--sheet)
3. [Bước 3: Chuẩn bị môi trường trên Ubuntu Server](#bước-3-chuẩn-bị-server-ubuntu)
4. [Bước 4: Cài đặt mã nguồn & Cấu hình môi trường (.env)](#bước-4-cài-đặt-mã-nguồn)
5. [Bước 5: Vận hành tự động bằng PM2](#bước-5-vận-hành-bằng-pm2)
6. [Bước 6: Cấu hình Nginx & Cấp chứng chỉ SSL HTTPS miễn phí](#bước-6-cấu-hình-nginx--ssl)
7. [Bước 7: Kiểm tra & Nghiệm thu](#bước-7-kiểm-tra--nghiệm-thu)

---

### BƯỚC 1: THIẾT LẬP GOOGLE SERVICE ACCOUNT

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/) bằng tài khoản Gmail của bạn.
2. Tạo 1 **Project mới** (ví dụ: `SIPAS-TungThien`).
3. Vào mục **APIs & Services > Library (Thư viện API)**:
   - Tìm và bấm **Enable (Bật)**: `Google Drive API`.
   - Tìm và bấm **Enable (Bật)**: `Google Sheets API`.
4. Vào mục **APIs & Services > Credentials (Thông tin xác thực)**:
   - Bấm **Create Credentials (Tạo thông tin xác thực)** > Chọn **Service Account (Tài khoản dịch vụ)**.
   - Đặt tên: `sipas-bot` > Bấm **Done**.
5. Bấm vào Service Account vừa tạo:
   - Chuyển sang tab **Keys (Khoá)** > Bấm **Add Key > Create new key > Chọn JSON** > Bấm **Create**.
   - Trình duyệt sẽ tự tải về 1 file `.json`. Đổi tên file này thành `credentials.json` và lưu lại.
   - Sao chép địa chỉ email của Service Account (có dạng: `sipas-bot@sipas-tungthien.iam.gserviceaccount.com`).

---

### BƯỚC 2: CẤP QUYỀN DRIVE & SHEET TRÊN GMAIL CÁ NHÂN

1. **Trên Google Drive của bạn:**
   - Tạo 1 Thư mục mới (ví dụ đặt tên: `KhaoSat_SIPAS_2026_PDF`).
   - Nhấp chuột phải vào thư mục > Chọn **Share (Chia sẻ)**.
   - Dán địa chỉ email của Service Account (`sipas-bot@...`) vào > Phân quyền **Editor (Người chỉnh sửa)** > Bỏ tick ô thông báo > Bấm **Share**.
   - Mở thư mục đó ra, nhìn lên thanh địa chỉ trình duyệt, copy đoạn ID của thư mục:
     `https://drive.google.com/drive/folders/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz`**
     -> Đây chính là `GOOGLE_DRIVE_FOLDER_ID`.

2. **Trên Google Sheets của bạn:**
   - Tạo 1 File Google Sheet mới (ví dụ đặt tên: `DuLieu_KhaoSat_SIPAS_2026`).
   - Bấm nút **Share (Chia sẻ)** ở góc trên bên phải.
   - Dán địa chỉ email của Service Account (`sipas-bot@...`) vào > Phân quyền **Editor (Người chỉnh sửa)** > Bấm **Share**.
   - Nhìn lên thanh địa chỉ, copy đoạn ID của bảng tính:
     `https://docs.google.com/spreadsheets/d/`**`1XyZ123456789abcdef`**`/edit`
     -> Đây chính là `GOOGLE_SPREADSHEET_ID`.

---

### BƯỚC 3: CHUẨN BỊ SERVER UBUNTU

Đăng nhập vào server Ubuntu qua SSH:
```bash
ssh root@your_server_ip
```

1. **Cập nhật hệ thống & cài đặt Node.js v20/v22:**
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

2. **Cài đặt các gói thư viện đồ hoạ cho Puppeteer xuất PDF trên Ubuntu:**
```bash
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

---

### BƯỚC 4: CÀI ĐẶT MÃ NGUỒN & CẤU HÌNH .ENV

1. Đưa toàn bộ thư mục mã nguồn lên thư mục `/var/www/sipas-survey` trên server:
```bash
sudo mkdir -p /var/www/sipas-survey
cd /var/www/sipas-survey
# Cài đặt dependencies
npm install
```

2. Đặt file `credentials.json` (tải từ Bước 1) vào `/var/www/sipas-survey/credentials.json`.

3. Tạo file cấu hình `.env`:
```bash
nano .env
```
Nội dung file `.env`:
```env
PORT=3005
NODE_ENV=production
DOMAIN=https://khaosat.phuongtungthien.vn

# Google Cloud Service Account (Google Sheets API)
GOOGLE_CREDENTIALS_PATH=./credentials.json
GOOGLE_SPREADSHEET_ID=1RuF8FIKLLG3H7JI4M6CZ2w_C0QF-E5ZqU7ViicBGA0c
GOOGLE_SHEET_NAME=Sheet1

# Google Drive (Gmail cá nhân Webhook)
GOOGLE_DRIVE_FOLDER_ID=1RPIJHMQOxyZNOFRw8Axax6vQSJ-h_f63
GOOGLE_DRIVE_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzgtvSTtZWzqqc6HE6tqvN2Vy4WFzOxGrAbXlsaDALrz3OVcasTqAaGRX6W3dW4M1TkqQ/exec
```
*(Bấm `Ctrl + O` rồi `Enter` để lưu, `Ctrl + X` để thoát).*

---

### BƯỚC 5: VẬN HÀNH TỰ ĐỘNG BẰNG PM2

1. Khởi chạy ứng dụng với file cấu hình PM2:
```bash
pm2 start ecosystem.config.js
```

2. Thiết lập PM2 tự động khởi động cùng hệ điều hành khi máy chủ reboot:
```bash
pm2 startup
# Chạy lệnh mà hệ thống vừa hướng dẫn (nếu có), sau đó:
pm2 save
```

3. Các lệnh quản trị hữu ích:
```bash
pm2 status                  # Xem trạng thái ứng dụng
pm2 logs sipas-survey-phuongtungthien # Xem log thời gian thực
pm2 restart all             # Khởi động lại ứng dụng
```

---

### BƯỚC 6: CẤU HÌNH NGINX & CẤP CHỨNG CHỈ SSL HTTPS

1. Trỏ bản ghi DNS của tên miền `khaosat.phuongtungthien.vn` (Bản ghi `A`) về địa chỉ IP của server Ubuntu `103.90.227.130`.

2. Cấu hình Nginx:
```bash
sudo nano /etc/nginx/sites-available/khaosat.phuongtungthien.vn
```
Dán nội dung cấu hình sau:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name khaosat.phuongtungthien.vn;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

3. Kích hoạt cấu hình Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/khaosat.phuongtungthien.vn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Cấp chứng chỉ bảo mật SSL (HTTPS) miễn phí tự động bằng Certbot:
```bash
sudo certbot --nginx -d khaosat.phuongtungthien.vn
```
*(Chọn chuyển hướng toàn bộ HTTP sang HTTPS theo gợi ý của Certbot).*

---

### BƯỚC 7: KIỂM TRA & NGHIỆM THU

1. Mở trình duyệt và truy cập: `https://khaosat.phuongtungthien.vn`
2. Điền thử 1 phiếu khảo sát và bấm **Gửi phiếu**.
3. Kiểm tra:
   - Màn hình nhận được mã số: `SIPAS-TT-2026-0001` (hoặc số tiếp theo).
   - Bấm nút **Tải phiếu tóm tắt (PDF)** xem file PDF được tải về máy.
   - Mở Google Drive cá nhân: Xem file PDF `Phieu_SIPAS_SIPAS-TT-2026-XXXX.pdf` đã xuất hiện trong thư mục chưa.
   - Mở Google Sheets cá nhân: Xem dòng dữ liệu mới và link PDF đã được điền tự động chưa.
