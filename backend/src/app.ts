import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import classRoutes from './routes/class.routes';
import semesterRoutes from './routes/semester.routes';
import trainingRoutes from './routes/training.routes';
import attendanceRoutes from './routes/attendance.routes';
import bchRoutes from './routes/bch.routes';
import activityRoutes from './routes/activity.routes';
import evidenceRoutes from './routes/evidence.routes';
import timetableRoutes from './routes/timetable.routes';
import roomRoutes from './routes/room.routes';
import settingRoutes from './routes/setting.routes';
import elearningRoutes from './routes/elearning.routes';
import borrowingRoutes from './routes/borrowing.routes';
import gradeRoutes from './routes/grade.routes';
import academicRoutes from './routes/academic.routes';
import financeRoutes from './routes/finance.routes';
import paymentRoutes from './routes/payment.routes';
import curriculumRoutes from './routes/curriculum.routes';
import notificationRoutes from './routes/notification.routes';
import auditRoutes from './routes/audit.routes';
import adminRoutes from './routes/admin.routes';
import serviceRoutes from './routes/service.routes';
import { getAllowedOrigins } from './utils/security';
import { securityHeadersMiddleware } from './middleware/security-headers.middleware';
import { csrfMiddleware } from './middleware/csrf.middleware';

const app = express();

const allowedOrigins = getAllowedOrigins();
console.log('Allowed Origins:', allowedOrigins);

app.set('trust proxy', 1);

app.use((req, res, next) => {
  console.log(`[GLOBAL LOG] ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token'],
}));
app.use(securityHeadersMiddleware);
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(csrfMiddleware);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/bch', bchRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/elearning', elearningRoutes);
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Student Management System API is running');
});
app.get('/api/verify-server', (req, res) => {
  res.json({ id: 'SERVER-001', time: new Date().toISOString() });
});

export default app;
