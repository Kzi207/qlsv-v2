import { Router } from 'express';
import { 
  createBchAccount, 
  getBchAccounts, 
  updateBchAccount, 
  deleteBchAccount, 
  assignStudents, 
  getAssignments,
  exportAssignments 
} from '../controllers/bch.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

// QTV can manage all CBNT accounts; BCH can manage accounts within their class scope.
router.use(authMiddleware);
router.use(roleMiddleware(['QTV', 'BCH']));

router.post('/', createBchAccount);
router.get('/', getBchAccounts);
router.put('/:id', updateBchAccount);
router.delete('/:id', deleteBchAccount);

router.post('/assign', assignStudents);
router.get('/export-assignments', exportAssignments);
router.get('/:bchUserId/assignments', getAssignments);

export default router;
