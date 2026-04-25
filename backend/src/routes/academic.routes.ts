import { Router } from 'express';
import { 
  getSubjects, createSubject, updateSubject, deleteSubject, bulkUpdateSubjectPrice,
  getMyRegistrations, registerSubject, cancelRegistration,
  getSubjectsByClass, assignSubjectToClass, unassignSubjectFromClass
} from '../controllers/academic.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// Subjects
router.get('/subjects', getSubjects);
router.put('/subjects/bulk-update-price', roleMiddleware(['QTV']), bulkUpdateSubjectPrice);
router.post('/subjects', roleMiddleware(['QTV']), createSubject);
router.put('/subjects/:id', roleMiddleware(['QTV']), updateSubject);
router.delete('/subjects/:id', roleMiddleware(['QTV']), deleteSubject);

// Registrations
router.get('/registrations/my', getMyRegistrations);
router.post('/registrations', roleMiddleware(['STUDENT']), registerSubject);
router.delete('/registrations/:id', cancelRegistration);

// Class Subjects
router.get('/class-subjects', getSubjectsByClass);
router.post('/class-subjects', roleMiddleware(['QTV']), assignSubjectToClass);
router.delete('/class-subjects/:id', roleMiddleware(['QTV']), unassignSubjectFromClass);

export default router;
