import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { VNPayService } from '../services/vnpay.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createVNPayPayment = async (req: Request, res: Response) => {
  try {
    const { tuitionId } = req.body;
    const user: any = (req as any).user; // Giả sử user đã được inject từ auth middleware
    
    if (!user || !user.studentId) {
       return res.status(403).json({ error: 'Chỉ sinh viên mới có thể thực hiện thanh toán.' });
    }

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    const payment = await PaymentService.createPayment({
      studentId: user.studentId,
      tuitionId: Number(tuitionId),
      ipAddr: (Array.isArray(ipAddr) ? ipAddr[0] : (ipAddr as string)) || '127.0.0.1',
    });

    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const handleVNPayReturn = async (req: Request, res: Response) => {
  try {
    const vnp_Params = req.query;
    const isValidSignature = VNPayService.verifySignature(vnp_Params);

    if (!isValidSignature) {
      return res.redirect(`${process.env.VNPAY_RETURN_URL}?status=error&message=InvalidSignature`);
    }

    const responseCode = vnp_Params['vnp_ResponseCode'];
    const paymentCode = vnp_Params['vnp_TxnRef'] as string;

    // Lưu log return (tùy chọn, vì IPN quan trọng hơn)
    const payment = await (prisma as any).payment.findUnique({ where: { paymentCode } });
    if (payment) {
        await (prisma as any).paymentLog.create({
            data: {
                paymentId: payment.id,
                type: 'RETURN',
                payload: vnp_Params as any,
            }
        });
    }

    if (responseCode === '00') {
      res.redirect(`${process.env.VNPAY_RETURN_URL}?status=success&paymentCode=${paymentCode}`);
    } else {
      res.redirect(`${process.env.VNPAY_RETURN_URL}?status=failed&code=${responseCode}`);
    }
  } catch (error) {
    console.error('Lỗi VNPay Return:', error);
    res.redirect(`${process.env.VNPAY_RETURN_URL}?status=error`);
  }
};

export const handleVNPayIPN = async (req: Request, res: Response) => {
  const result = await PaymentService.handleIPN(req.query);
  res.json(result);
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentCode } = req.params;
    const status = await PaymentService.getPaymentStatus(paymentCode as string);
    if (!status) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
