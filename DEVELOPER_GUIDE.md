# 📘 Hướng Dẫn Dành Cho Lập Trình Viên (Developer Onboarding Guide)

Tài liệu này được soạn thảo để giúp một lập trình viên (Developer) mới tham gia vào dự án **QLSV (Quản Lý Sinh Viên)** có thể hiểu toàn bộ vòng đời của code, kiến trúc hệ thống, các công nghệ đang sử dụng và cách để phát triển thêm tính năng mới.

---

## 1. 🏗️ Kiến Trúc Hệ Thống (Architecture)

Dự án sử dụng mô hình **Client-Server** (Frontend & Backend tách biệt).

- **Frontend**: Single Page Application (SPA) xây dựng bằng React.js. Tương tác với Backend thông qua RESTful APIs.
- **Backend**: Node.js API Server sử dụng Express.js. Chịu trách nhiệm xử lý logic, xác thực, và tương tác với Database.
- **Database**: Relational Database (MySQL/PostgreSQL) được quản lý thông qua **Prisma ORM**.

---

## 2. 🛠️ Tech Stack Chi Tiết

### Frontend
- **Core**: `React 18` + `TypeScript` (Strict mode).
- **Build Tool**: `Vite` (Cực kỳ nhanh, hỗ trợ HMR tốt).
- **Routing**: `React Router DOM v6` (Quản lý các trang và layout).
- **State Management**: `Zustand` (Sử dụng cho Global state như `useAuthStore` để lưu thông tin User đăng nhập).
- **Styling**: `Tailwind CSS v3`. Hệ thống sử dụng phong cách thiết kế hiện đại (Bento Grid, Glassmorphism, bo góc lớn 16px-24px).
- **API Client**: `Axios` (Được cấu hình sẵn instance tại `src/api/axios.ts` để tự động đính kèm credentials/cookies).
- **UI Libraries**: `Framer Motion` (Animation mượt mà), `Lucide React` (Icon), `React Hot Toast` (Thông báo/Alert).

### Backend
- **Core**: `Node.js` + `Express.js` + `TypeScript`.
- **ORM**: `Prisma Client` (Type-safe database interaction). Prisma giúp viết query SQL bằng object TS an toàn.
- **Authentication**: `JSON Web Token (JWT)`. Token được ký và lưu vào **HTTP-only Cookie** để chống XSS.
- **Security & Encryption**: `crypto` (Mã hóa AES-256 các thông tin nhạy cảm của sinh viên).
- **Validation**: Thường được xử lý thủ công trong controller hoặc sử dụng thư viện (nếu có bổ sung).

---

## 3. 📂 Cấu Trúc Thư Mục & Luồng Dữ Liệu (Data Flow)

### Sơ đồ cấu trúc tổng quan
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
```

### Luồng Dữ Liệu Backend: `Route -> Middleware -> Controller -> Prisma -> Response`
- **`backend/src/routes/`**: Định nghĩa URL (VD: `router.get('/me', authMiddleware, authController.me)`).
- **`backend/src/middleware/`**: `auth.ts` kiểm tra cookie chứa JWT hợp lệ không, giải mã và nhét `userId` vào `req.user`.
- **`backend/src/controllers/`**: Nhận request, gọi DB, xử lý logic (VD: mã hóa/giải mã), trả về JSON.
- **`backend/prisma/schema.prisma`**: Nơi duy nhất định nghĩa Database schema. Mọi thay đổi bảng phải làm ở đây.

### Luồng Dữ Liệu Frontend: `Component -> API Call -> Update State -> Render`
- **`frontend/src/pages/`**: Các trang lớn (VD: `Profile.tsx`, `Schedule.tsx`). Quản lý state cục bộ của trang đó.
- **`frontend/src/components/`**: Các UI nhỏ có thể tái sử dụng (VD: `EventCard.tsx`, `HeaderBar.tsx`).
- **`frontend/src/store/useAuthStore.ts`**: Lưu thông tin `user` hiện tại. Bất cứ component nào cần thông tin user chỉ cần gọi `const { user } = useAuthStore()`.

---

## 4. 🗄️ Database Schema Cốt Lõi (Prisma)

Bật file `backend/prisma/schema.prisma` lên, bạn sẽ thấy các Model chính:
- **`User`**: Tài khoản đăng nhập (chứa username, password (đã băm bcrypt), role: ADMIN, LECTURER, STUDENT).
- **`Student`**: Thông tin học vụ chi tiết (liên kết 1-1 với `User`). Chứa mã hóa AES cho các trường: `birthday`, `id_card`, `address`, `hometown`.
- **`Class`**: Quản lý lớp học.
- **`Event` / `Timetable`**: Quản lý sự kiện, lịch học (tham chiếu tới `Class` hoặc `User`).

*Lưu ý: Bất cứ khi nào bạn sửa file `schema.prisma`, bạn PHẢI chạy:*
```bash
npx prisma db push   # Áp dụng lên DB
npx prisma generate  # Tạo lại Type-safe client cho code TS
```

---

## 5. 🔐 Cơ Chế Mã Hóa Thông Tin Nhạy Cảm (Quan trọng)

Hệ thống có cơ chế bảo vệ thông tin sinh viên rất chặt chẽ:
1.  **Khi Lưu/Cập nhật (Controller)**: Trước khi `prisma.student.update`, dữ liệu như `id_card` sẽ chạy qua hàm `encrypt(id_card)` (từ `utils/encryption.ts`).
2.  **Khi Trả về Frontend**: Dữ liệu từ DB lấy lên sẽ chạy qua hàm `toSafeUser(user)` (trong `auth.controller.ts`), tại đây các trường sẽ được `decrypt()` ngược lại thành plain-text để giao diện hiển thị.

*=> Bạn KHÔNG BAO GIỜ được gửi trực tiếp dữ liệu mã hóa từ DB xuống Frontend mà không qua bước `decrypt`.*

---

## 6. 🚀 Hướng Dẫn Thêm Một Tính Năng Mới (Step-by-step)

*Ví dụ: Bạn muốn thêm trường "Sở thích" (Hobby) cho Sinh viên.*

### Bước 1: Sửa Database (Backend)
1. Mở `backend/prisma/schema.prisma`.
2. Thêm `hobby String?` vào model `Student`.
3. Chạy `npx prisma db push` và `npx prisma generate`.

### Bước 2: Sửa API (Backend)
1. Mở `backend/src/controllers/student.controller.ts`.
2. Trong API `updateStudentProfile`, lấy thêm `hobby` từ `req.body` và nhét vào lệnh `prisma.student.update`. (Nếu là thông tin nhạy cảm thì thêm hàm `encrypt(hobby)`).
3. Mở `backend/src/controllers/auth.controller.ts` (Hàm `toSafeUser`), thêm `hobby` vào object trả về (nếu mã hóa thì `decrypt(hobby)`).

### Bước 3: Sửa Giao Diện (Frontend)
1. Mở `frontend/src/pages/Profile.tsx`.
2. Khai báo thêm `hobby` vào state `detailsFormData`.
3. Tạo 1 ô `<input>` trên giao diện để người dùng nhập `hobby`.
4. Hàm `handleUpdateDetails` đã tự động gửi toàn bộ `detailsFormData` lên API, nên bạn không cần sửa hàm submit.

---

## 7. 🧩 Quy Chuẩn Code (Coding Conventions)

1.  **TypeScript First**: Luôn định nghĩa `interface` hoặc `type` cho các object (VD: `interface TimetableEvent`). Tránh dùng `any` trừ khi bất khả kháng.
2.  **Tailwind Class Order**: Viết class theo thứ tự: Layout (`flex`, `grid`) -> Positioning (`relative`, `absolute`) -> Spacing (`p-4`, `m-2`) -> Styling (`bg-white`, `text-blue`).
3.  **Tách Component**: Nếu 1 file `.tsx` dài quá 300 dòng, hãy cân nhắc tách các khối UI thành các component con đặt trong folder `components/`.
4.  **Error Handling**: Trong Frontend, luôn bọc API call bằng `try...catch` và dùng `toast.error()` để báo lỗi cho người dùng.

---

## 8. 🚨 Khắc Phục Sự Cố Thường Gặp (Troubleshooting)

-   **Lỗi CORS (Cross-Origin Resource Sharing)**:
    -   *Nguyên nhân*: Frontend gọi API Backend sai port hoặc thiếu credentials.
    -   *Cách fix*: Kiểm tra `cors` middleware trong `backend/src/server.ts`. Chắc chắn `origin` khớp với URL frontend và `credentials: true`.
-   **Lỗi Session/Cookie bị văng**:
    -   *Cách fix*: Đảm bảo Frontend Axios có `withCredentials: true`. Kiểm tra token JWT có bị hết hạn không.
-   **Lỗi Prisma Type Error**:
    -   *Nguyên nhân*: File `schema.prisma` đã đổi nhưng chưa generate lại client.
    -   *Cách fix*: Chạy `cd backend && npx prisma generate`. Chạy lại backend.

---

Chúc bạn code vui vẻ! Mọi phần code phức tạp (như Thời khóa biểu) đã được đóng gói thành các component tái sử dụng (như `EventCard`, `WeekView`). Hãy tận dụng chúng nhé!
