import { Router } from 'express';
import { 
  getAllTimetables, 
  createTimetable, 
  updateTimetable, 
  deleteTimetable,
  getLecturers,
  exportTimetables,
  importTimetables,
  checkConflictsBatch,
  bulkCreateSchedules,
  getSuggestedSubjects
} from '../controllers/timetable.controller';
import { protect, admin } from '../middleware/auth.middleware';
import multer from 'multer';

const upload = multer();
const router = Router();

router.get('/', protect, getAllTimetables);
router.get('/export', protect, admin, exportTimetables);
router.post('/import', protect, admin, upload.single('file'), importTimetables);
router.get('/lecturers', protect, admin, getLecturers);
router.get('/suggest-subjects', protect, admin, getSuggestedSubjects);
router.post('/check-conflicts', protect, admin, checkConflictsBatch);
router.post('/bulk', protect, admin, bulkCreateSchedules);
router.post('/', protect, admin, createTimetable);
router.put('/:id', protect, admin, updateTimetable);
router.delete('/:id', protect, admin, deleteTimetable);

export default router;
