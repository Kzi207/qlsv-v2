import { Router } from 'express';
import { 
  getFaculties, 
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getMajors, 
  createMajor,
  updateMajor,
  deleteMajor,
  getMajorCurriculum, 
  addSubjectToCurriculum,
  updateCurriculumSubject,
  deleteCurriculumSubject,
  getMyCurriculum,
  addSemester
} from '../controllers/curriculum.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = Router();

router.get('/my-curriculum', protect, getMyCurriculum);

// Faculties
router.get('/faculties', protect, getFaculties);
router.post('/faculties', protect, admin, createFaculty);
router.put('/faculties/:id', protect, admin, updateFaculty);
router.delete('/faculties/:id', protect, admin, deleteFaculty);

// Majors
router.get('/majors', protect, getMajors);
router.post('/majors', protect, admin, createMajor);
router.put('/majors/:id', protect, admin, updateMajor);
router.delete('/majors/:id', protect, admin, deleteMajor);

router.get('/majors/:id/curriculum', protect, getMajorCurriculum);

// Admin only actions
router.post('/subjects', protect, admin, addSubjectToCurriculum);
router.post('/majors/:majorId/subjects', protect, admin, addSubjectToCurriculum);
router.put('/subjects/:id', protect, admin, updateCurriculumSubject);
router.delete('/subjects/:id', protect, admin, deleteCurriculumSubject);
router.post('/majors/:majorId/semesters', protect, admin, addSemester);

export default router;
