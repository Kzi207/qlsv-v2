import { Router } from 'express';
import { 
  createOrUpdateTrainingScore, 
  getTrainingScoreByStudent, 
  getTrainingScores, 
  getTrainingScoreById,
  approveTrainingScore,
  createTrainingScore,
  getSubmissionStatus,
  getTrainingStats,
  exportTrainingScoresExcel,
} from '../controllers/training.controller';
import { getEvidenceFile, uploadEvidence } from '../controllers/upload.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/export', roleMiddleware(['QTV']), exportTrainingScoresExcel);
router.get('/submission-status', getSubmissionStatus);
router.get('/stats', roleMiddleware(['QTV', 'BCH', 'LECTURER']), getTrainingStats);
router.get('/evidence/:encodedKey', getEvidenceFile);
router.get('/', (req, res, next) => {
  const { studentId } = req.query;
  if (studentId) return getTrainingScoreByStudent(req, res);
  return getTrainingScores(req, res);
});
router.get('/student/:studentId', getTrainingScoreByStudent);
router.get('/:id', getTrainingScoreById);
router.patch('/:id/approve', roleMiddleware(['QTV', 'BCH', 'LECTURER']), approveTrainingScore);
router.post('/upload-evidence', uploadEvidence);
router.post('/', createTrainingScore);

export default router;
