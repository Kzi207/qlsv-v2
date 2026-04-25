import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Endpoint tạo thanh toán (Cần đăng nhập)
router.post('/vnpay/create', authMiddleware, PaymentController.createVNPayPayment);

// Endpoint nhận kết quả trả về từ VNPay (Redirect)
router.get('/vnpay/return', PaymentController.handleVNPayReturn);

// Endpoint nhận Webhook từ VNPay (IPN)
router.get('/vnpay/ipn', PaymentController.handleVNPayIPN);

// Lấy trạng thái giao dịch
router.get('/:paymentCode/status', authMiddleware, PaymentController.getPaymentStatus);

export default router;
