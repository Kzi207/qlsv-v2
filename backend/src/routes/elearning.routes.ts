import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as elearningController from '../controllers/elearning.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for media storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/media';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Courses
router.get('/courses', authMiddleware, elearningController.getCourses);
router.post('/courses', authMiddleware, elearningController.createCourse);
router.get('/courses/:id', authMiddleware, elearningController.getCourseDetail);
router.put('/courses/:id', authMiddleware, elearningController.updateCourse);
router.get('/subjects', authMiddleware, elearningController.getSubjects);
router.get('/teachers', authMiddleware, elearningController.getTeachers);

// Stats
router.get('/stats', authMiddleware, elearningController.getSystemStats);
router.get('/teacher-stats', authMiddleware, elearningController.getTeacherStats);

// Lessons
router.get('/lessons', authMiddleware, elearningController.getLessons);
router.post('/lessons', authMiddleware, upload.single('file'), elearningController.createLesson);
router.patch('/lessons/:id/visibility', authMiddleware, elearningController.updateLessonVisibility);
router.delete('/lessons/:id', authMiddleware, elearningController.deleteLesson);

// Assignments
router.post('/assignments', authMiddleware, elearningController.createAssignment);
router.post('/assignments/submit', authMiddleware, upload.single('file'), elearningController.submitAssignment);
router.patch('/submissions/:id/grade', authMiddleware, elearningController.gradeSubmission);
router.delete('/assignments/:id', authMiddleware, elearningController.deleteAssignment);

// Exams
router.post('/exams', authMiddleware, elearningController.createExam);
router.get('/exams/:id', authMiddleware, elearningController.getExamDetails);
router.post('/exams/submit', authMiddleware, elearningController.submitExam);
router.delete('/exams/:id', authMiddleware, elearningController.deleteExam);
router.post('/exams/import-word', authMiddleware, upload.single('file'), elearningController.importExamQuestionsWord);

// Registrations
router.get('/courses/:id/registrations', authMiddleware, elearningController.getCourseRegistrations);
router.post('/enroll', authMiddleware, elearningController.enrollStudent);
router.delete('/registrations/:id', authMiddleware, elearningController.deleteRegistration);

export default router;
