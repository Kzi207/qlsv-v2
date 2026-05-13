# 🎓 Hệ thống Quản trị Sinh viên Thông minh & Đánh giá Điểm rèn luyện Toàn diện

![Version](https://img.shields.io/badge/version-2.0.0--stable-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-Copyrighted-red?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

**Hệ thống Quản lý Sinh viên (QLSV)** là giải pháp phần mềm được thiết kế để chuẩn hóa và tự động hóa quy trình quản lý học thuật, đánh giá rèn luyện và theo dõi chuyên cần. Dự án tập trung vào trải nghiệm người dùng cao cấp (Premium UX), bảo mật dữ liệu và hiệu năng tối ưu.

---

## 💎 Kiến trúc Công nghệ Chi tiết (Detailed Tech Stack)

Hệ thống được xây dựng trên một nền tảng công nghệ đồng bộ, đảm bảo tính ổn định và hiệu suất cao nhất:


### 🎨 Frontend - Giao diện & Trải nghiệm
- **Ngôn ngữ Core**: [TypeScript](https://www.typescriptlang.org/) - Đảm bảo an toàn kiểu dữ liệu (Type-safe) và giảm thiểu lỗi logic trong quá trình phát triển.
- **Thư viện chính**: [React 18](https://react.dev/) - Tận dụng sức mạnh của Concurrent Mode và Hooks để tối ưu hóa hiệu năng rendering.
- **Build Tool**: [Vite](https://vitejs.dev/) - Công cụ đóng gói mã nguồn thế hệ mới, cho phép Hot Module Replacement (HMR) cực nhanh.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Framework CSS tiện ích giúp xây dựng giao diện tùy biến, responsive và tối ưu dung lượng tệp CSS đầu ra.
- **Quản lý trạng thái**: [Zustand](https://zustand-demo.pmnd.rs/) - Giải pháp quản lý state gọn nhẹ nhưng mạnh mẽ, thay thế cho Redux cồng kềnh.
- **Thành phần bổ trợ**:
  - `Lucide React`: Bộ icon vector sắc nét, đồng bộ.
  - `React Router Dom v6`: Quản lý điều hướng trang linh hoạt.
  - `React Hot Toast`: Hệ thống thông báo (notifications) mượt mà.
  - `Axios`: Xử lý các yêu cầu HTTP API với cơ chế Interceptor bảo mật.

### ⚙️ Backend - Xử lý & Nghiệp vụ
- **Runtime**: [Node.js](https://nodejs.org/) - Môi trường chạy JavaScript phía máy chủ với hiệu suất xử lý bất đồng bộ (I/O) vượt trội.
- **Framework**: [Express.js](https://expressjs.com/) - Framework tối giản, linh hoạt cho việc xây dựng RESTful APIs chuyên nghiệp.
- **Database ORM**: [Prisma](https://www.prisma.io/) - Công cụ quản lý cơ sở dữ liệu thế hệ mới, tự động hóa việc tạo migration và cung cấp Type-safe Client.
- **Bảo mật & Xác thực**:
  - `JWT (JSON Web Token)`: Cơ chế xác thực không trạng thái (stateless) an toàn.
  - `bcrypt`: Thuật toán mã hóa mật khẩu một chiều cấp độ quân đội.
  - `CORS`: Cấu hình chia sẻ tài nguyên giữa các nguồn gốc khác nhau.
- **Lưu trữ**: Tích hợp Cloudflare R2 (S3-Compatible) hoặc File System tùy biến.

### 📊 Cơ sở dữ liệu (Database)
- Hỗ trợ tốt nhất trên **MySQL 8.0** hoặc **PostgreSQL**, được thiết kế chuẩn hóa để xử lý các truy vấn quan hệ phức tạp giữa Sinh viên, Học kỳ và Điểm rèn luyện.

---

## 🛠️ Hệ thống Tính năng 

### 1. Phân hệ Điểm rèn luyện (DRL Evaluation)
-   **Cơ chế đánh giá đa tầng**: Sinh viên tự chấm -> Lớp kiểm tra -> Admin phê duyệt.
-   **Evidence Management**: Hệ thống quản lý minh chứng thông minh, cho phép upload đa định dạng.
-   **Premium Viewer**: Trình xem ảnh/PDF tích hợp Portal, hỗ trợ xoay, thu phóng và điều hướng mượt mà không làm gián đoạn luồng làm việc.

### 2. Phân hệ Chuyên cần QR (Smart Attendance)
-   **Dynamic QR Generation**: Mã QR được tạo động theo thời gian thực và vị trí lớp học.
-   **Security Check-in**: Ngăn chặn gian lận điểm danh qua cơ chế xác thực phiên làm việc.

### 3. Quản trị Học kỳ & Lớp học
-   **Flexible Scoping**: Cấu hình học kỳ linh hoạt, áp dụng cho toàn hệ thống hoặc từng đơn vị lớp cụ thể.
-   **Data Migration**: Nhập xuất dữ liệu hàng loạt qua Excel với công cụ xử lý dữ liệu (Bulk Import/Export) tối ưu.

### 4. Phân quyền tài khoản
-   **Flexible Scoping**: Cấu hình quyền hạn linh hoạt, áp dụng cho toàn hệ thống hoặc từng đơn vị lớp cụ thể.


---

## 📂 Cấu trúc Hệ thống (System Structure)

```text
qlsv/
├── backend/                  # Server-side High Performance Core
│   ├── prisma/               # Database Architecture & ORM
│   │   ├── schema.prisma     # Nơi định nghĩa cấu trúc DB (Tables & Relations)
│   │   └── migrations/       # Lịch sử phiên bản cấu trúc Database
│   ├── src/                  # Mã nguồn Backend (TypeScript)
│   │   ├── controllers/      # Nơi xử lý Request/Response (auth, student, admin)
│   │   ├── middleware/       # Lớp bảo vệ (JWT Auth, Error Handler, Phân quyền)
│   │   ├── routes/           # Định nghĩa các đường dẫn API (Endpoints mapping)
│   │   ├── services/         # Logic nghiệp vụ phức tạp (Xử lý file Excel, cronjob)
│   │   ├── utils/            # Hàm tiện ích (Mã hóa bảo mật AES, format dữ liệu)
│   │   └── server.ts         # Điểm khởi tạo & cấu hình Express Server
│   ├── uploads/              # Thư mục lưu trữ cục bộ (Minh chứng, Avatar)
│   └── package.json          # Quản lý thư viện Backend
│
├── frontend/                 # Premium Client Application
│   ├── public/               # Static Assets (Logo, PWA Manifest, Icons)
│   ├── src/                  # Mã nguồn Frontend (React + TypeScript)
│   │   ├── api/              # Cấu hình Axios (Interceptors, gọi API)
│   │   ├── components/       # Các UI Component dùng chung (Nút, Form, Modal)
│   │   │   └── timetable/    # Các module chuyên biệt cho Thời khóa biểu
│   │   ├── layout/           # Cấu trúc khung trang (Sidebar, Header chung)
│   │   ├── pages/            # Các trang chức năng (Profile, Timetable, DRL)
│   │   ├── store/            # Quản lý State toàn cục bằng Zustand (AuthStore)
│   │   ├── utils/            # Helper functions xử lý UI logic
│   │   ├── App.tsx           # Quản lý Routing toàn ứng dụng
│   │   └── main.tsx          # Điểm gắn kết React vào DOM
│   ├── tailwind.config.js    # Cấu hình Design System (Màu sắc, Font)
│   └── package.json          # Quản lý thư viện Frontend
│
├── DEVELOPER_GUIDE.md        # Cẩm nang chi tiết dành cho lập trình viên mới
├── PROJECT_DOCUMENTATION.md  # Tài liệu kỹ thuật tổng quan về chức năng dự án
└── README.md                 # Giới thiệu & Hướng dẫn cài đặt nhanh
```

---

## ⚡ Hướng dẫn Triển khai (Deployment Guide)

### Bước 1: Chuẩn bị Môi trường
-   Yêu cầu: Node.js (phiên bản Long Term Support), NPM/Yarn.
-   Cơ sở dữ liệu: MySQL 8.0+ hoặc PostgreSQL 14+.

### Bước 2: Thiết lập Backend
```bash
cd backend
npm install
# Cấu hình file .env dựa trên .env.example (DATABASE_URL, JWT_SECRET, R2_CONFIG)
npx prisma generate
npx prisma db push
npm run dev
```

### Bước 3: Thiết lập Frontend
```bash
cd frontend
npm install
# Cấu hình file .env dựa trên .env.example (VITE_API_URL)
npm run dev
```

---

## 🔒 Bản quyền & Bảo mật (Copyright & Security)

> [!IMPORTANT]
> **THÔNG BÁO BẢN QUYỀN TRÍ TUỆ**
> 
> Toàn bộ mã nguồn, thiết kế giao diện (UI/UX), cấu trúc dữ liệu và logic nghiệp vụ thuộc quyền sở hữu trí tuệ của **LÊ KHÁNH DUY**. 
> 
> 1. **Nghiêm cấm sao chép**: Không được phép sao chép, chỉnh sửa hoặc tái phân phối bất kỳ phần nào của dự án này khi chưa có sự đồng ý bằng văn bản của tác giả.
> 2. **Sử dụng thương mại**: Việc sử dụng dự án cho mục đích thương mại mà không có giấy phép hợp lệ là vi phạm pháp luật.
> 3. **Bảo mật**: Mọi hành vi xâm nhập trái phép hoặc can thiệp vào mã nguồn nhằm mục đích phá hoại sẽ bị xử lý theo quy định.

**© 2026 LÊ KHÁNH DUY. All Rights Reserved.**

---

## 📞 Liên hệ (Contact Information)

Mọi thắc mắc về bản quyền, hỗ trợ kỹ thuật hoặc yêu cầu tùy biến hệ thống, vui lòng liên hệ qua:

-   **Tác giả**: Lê Khánh Duy
-   **Vai trò**: 
-   **Email**: [toi05022020@gmail.com]
-   **Dự án**: Hệ thống QLSV v1.0

## 🔧 API quản lý tài khoản CBNT
- `GET /api/bch`:
  - `QTV`: xem toàn bộ tài khoản `QTV` / `LECTURER` / `BCH`.
  - `BCH`: chỉ xem tài khoản `BCH` trong lớp mình.
- `POST /api/bch`:
  - `QTV`: tạo `QTV`, giảng viên hoặc `BCH`.
  - `BCH`: chỉ tạo tài khoản `BCH` trong lớp của mình.
  - Payload chính: `username`, `password?`, `name`, `email?`, `phone?`, `role`, `position?`, `class_id?`, `teachingSubjectId?`.
- `PUT /api/bch/:id`:
  - Hỗ trợ cập nhật `name`, `email`, `phone`, `position`, `class_id`, `role`, `password`, `teachingSubjectId`.
- `DELETE /api/bch/:id`:
  - Xóa tài khoản và dọn các phân công liên quan.
- `POST /api/bch/assign`:
  - Gán dải STT sinh viên cho BCH theo lớp.
- `GET /api/bch/export-assignments`:
  - Xuất file phân công theo lớp.
