import { PrismaClient } from '@prisma/client';
import { VNPayService } from './vnpay.service';

const prisma = new PrismaClient();

export class PaymentService {
  /**
   * Tạo giao dịch thanh toán
   */
  static async createPayment(params: {
    studentId: number;
    tuitionId: number;
    ipAddr: string;
  }) {
    const { studentId, tuitionId, ipAddr } = params;

    // 1. Kiểm tra học phí trong DB (Bảo mật: Lấy số tiền từ Server)
    const tuition = await (prisma as any).tuition.findUnique({
      where: { id: tuitionId },
    });

    if (!tuition || tuition.studentId !== studentId) {
      throw new Error('Học phí không hợp lệ hoặc không thuộc về sinh viên này.');
    }

    if (tuition.status === 'PAID' || tuition.remainingAmount <= 0) {
      throw new Error('Học phí này đã được thanh toán hoàn tất.');
    }

    // 2. Chống thanh toán trùng (Chỉ cho phép 1 giao dịch PENDING tại 1 thời điểm)
    const pendingPayment = await (prisma as any).payment.findFirst({
      where: {
        tuitionId,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Trong vòng 15 phút qua
        },
      },
    });

    if (pendingPayment) {
      return { paymentUrl: pendingPayment.paymentUrl, paymentCode: pendingPayment.paymentCode };
    }

    // 3. Tạo PaymentCode duy nhất (vnp_TxnRef)
    const paymentCode = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 4. Tạo URL VNPay
    const paymentUrl = VNPayService.createPaymentUrl({
      amount: tuition.remainingAmount,
      ipAddr,
      orderInfo: `Thanh toan hoc phi hoc ky ${tuition.semesterId}`,
      txnRef: paymentCode,
    });

    // 5. Lưu giao dịch PENDING vào DB
    const payment = await (prisma as any).payment.create({
      data: {
        studentId,
        tuitionId,
        paymentCode,
        amount: tuition.remainingAmount,
        paymentUrl,
        status: 'PENDING',
      },
    });

    return payment;
  }

  /**
   * Xử lý kết quả IPN (Nguồn tin cậy nhất)
   */
  static async handleIPN(vnp_Params: any) {
    // 1. Verify chữ ký
    const isValidSignature = VNPayService.verifySignature(vnp_Params);
    if (!isValidSignature) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const paymentCode = vnp_Params['vnp_TxnRef'];
    const amount = Number(vnp_Params['vnp_Amount']) / 100;
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];

    // 2. Tìm giao dịch trong DB
    const payment = await (prisma as any).payment.findUnique({
      where: { paymentCode },
      include: { tuition: true },
    });

    if (!payment) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Kiểm tra số tiền
    if (payment.amount !== amount) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // 4. Kiểm tra trạng thái hiện tại (Chống xử lý lặp lại)
    if (payment.status !== 'PENDING') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 5. Bắt đầu Transaction cập nhật dữ liệu
    try {
      await prisma.$transaction(async (tx) => {
        // Lưu log VNPay
        await (tx as any).paymentLog.create({
          data: {
            paymentId: payment.id,
            type: 'IPN',
            payload: vnp_Params,
          },
        });

        if (responseCode === '00') {
          // Thanh toán thành công
          await (tx as any).payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              providerTransactionId: transactionNo,
              paidAt: new Date(),
            },
          });

          // Cập nhật bảng Tuition
          const newPaidAmount = payment.tuition.paidAmount + amount;
          const newRemainingAmount = Math.max(0, payment.tuition.totalAmount - newPaidAmount);
          const newStatus = newRemainingAmount === 0 ? 'PAID' : 'PARTIAL_PAID';

          await (tx as any).tuition.update({
            where: { id: payment.tuitionId },
            data: {
              paidAmount: newPaidAmount,
              remainingAmount: newRemainingAmount,
              status: newStatus,
            },
          });
        } else {
          // Thanh toán thất bại
          await (tx as any).payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });
        }
      });

      return { RspCode: '00', Message: 'Success' };
    } catch (error) {
      console.error('Lỗi xử lý IPN Transaction:', error);
      return { RspCode: '99', Message: 'Internal Error' };
    }
  }

  /**
   * Lấy trạng thái giao dịch
   */
  static async getPaymentStatus(paymentCode: string) {
    return await (prisma as any).payment.findUnique({
      where: { paymentCode },
      select: { status: true, amount: true, paidAt: true },
    });
  }
}
