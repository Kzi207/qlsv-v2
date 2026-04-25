import { Router } from 'express';
import { 
  createSession, 
  scanQR, 
  getMyRecords, 
  getSessionStats, 
  updateRecord, 
  deleteRecord, 
  toggleSessionStatus,
  getAllSessions,
  deleteSession,
  uploadEvidence,
  getMyEvidenceRequests,
  getAllPendingEvidence,
  reviewEvidence
} from '../controllers/activity.controller';
import { protect, admin } from '../middleware/auth.middleware';
import { uploadEvidenceMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Student routes
router.post('/scan', protect, scanQR);
router.get('/my-records', protect, getMyRecords);
router.post('/evidence/upload', protect, uploadEvidenceMiddleware.single('image'), uploadEvidence);
router.get('/evidence/my', protect, getMyEvidenceRequests);

// Admin routes
router.post('/generate', protect, admin, createSession);
router.get('/sessions', protect, admin, getAllSessions);
router.get('/stats/:sessionId', protect, admin, getSessionStats);
router.put('/record/:id', protect, admin, updateRecord);
router.delete('/record/:id', protect, admin, deleteRecord);
router.delete('/session/:id', protect, admin, deleteSession);
router.patch('/session/:id/status', protect, admin, toggleSessionStatus);
router.get('/evidence/pending', protect, admin, getAllPendingEvidence);
router.patch('/evidence/review/:id', protect, admin, reviewEvidence);

export default router;
