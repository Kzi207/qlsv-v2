import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Endpoint tạo thanh toán (Cần đăng nhập)
router.post('/create', authMiddleware, PaymentController.createPayment);
router.post('/vnpay/create', authMiddleware, PaymentController.createVNPayPayment);

// Endpoint nhận kết quả trả về từ VNPay (Redirect)
router.get('/vnpay/return', PaymentController.handleVNPayReturn);

// Endpoint nhận Webhook từ VNPay (IPN)
router.get('/vnpay/ipn', PaymentController.handleVNPayIPN);

// Endpoint nhận Webhook từ SePay
router.post('/sepay/webhook', PaymentController.handleSePayWebhook);

// Lấy trạng thái giao dịch
router.get('/:paymentCode/status', authMiddleware, PaymentController.getPaymentStatus);

// Lấy lịch sử giao dịch của tôi
router.get('/my/history', authMiddleware, PaymentController.getMyPayments);
router.post('/:paymentCode/cancel', authMiddleware, PaymentController.cancelPayment);

export default router;
