import { PrismaClient } from '../generated/client_final';
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
    provider?: string;
  }) {
    const { studentId, tuitionId, ipAddr, provider = 'VNPAY' } = params;

    // 1. Kiểm tra học phí trong DB
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
        provider,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Trong vòng 15 phút qua
        },
      },
    });

    if (pendingPayment) {
      return pendingPayment;
    }

    // 3. Tạo PaymentCode duy nhất
    const paymentCode = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

    let paymentUrl = null;
    if (provider === 'VNPAY') {
      // Tạo URL VNPay
      paymentUrl = VNPayService.createPaymentUrl({
        amount: tuition.remainingAmount,
        ipAddr,
        orderInfo: `Thanh toan hoc phi hoc ky ${tuition.semesterId}`,
        txnRef: paymentCode,
      });
    }

    // 4. Lưu giao dịch PENDING vào DB
    const payment = await (prisma as any).payment.create({
      data: {
        studentId,
        tuitionId,
        paymentCode,
        amount: tuition.remainingAmount,
        paymentUrl,
        provider,
        status: 'PENDING',
        updatedAt: new Date()
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
      await prisma.$transaction(async (tx: any) => {
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
              updatedAt: new Date()
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
              updatedAt: new Date()
            },
          });
        } else {
          // Thanh toán thất bại
          await (tx as any).payment.update({
            where: { id: payment.id },
            data: { 
              status: 'FAILED',
              updatedAt: new Date()
            },
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
   * Xử lý kết quả từ SePay Webhook (Chuyển khoản ngân hàng)
   */
  static async handleSePayWebhook(payload: any) {
    const { content, transferAmount, code, gateway, transactionDate } = payload;
    console.log('[SePay Webhook] Payload received:', payload);
    
    // 1. Tìm PaymentCode trong nội dung chuyển khoản (Ví dụ: PAY123456)
    const match = content.match(/PAY\d+/i);
    if (!match) {
      console.warn('[SePay Webhook] No payment code found in content:', content);
      return { status: 'ignored', message: 'No payment code found in content' };
    }
    
    const paymentCode = match[0].toUpperCase();
    console.log('[SePay Webhook] Extracted PaymentCode:', paymentCode);
    const amount = Number(transferAmount);

    // 2. Tìm giao dịch trong DB
    const payment = await (prisma as any).payment.findUnique({
      where: { paymentCode },
      include: { tuition: true },
    });

    if (!payment) {
      console.error('[SePay Webhook] Payment not found for code:', paymentCode);
      return { status: 'error', message: `Order ${paymentCode} not found` };
    }

    // 3. Kiểm tra trạng thái hiện tại
    if (payment.status !== 'PENDING') {
      return { status: 'ignored', message: 'Order already processed' };
    }

    // 4. Bắt đầu Transaction
    try {
      await prisma.$transaction(async (tx: any) => {
        // Lưu log SePay
        await (tx as any).paymentLog.create({
          data: {
            paymentId: payment.id,
            provider: 'SEPAY',
            type: 'WEBHOOK',
            payload: JSON.stringify(payload),
          },
        });

        // So sánh số tiền (Chấp nhận nếu bằng hoặc lớn hơn)
        if (amount >= payment.amount) {
          await (tx as any).payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              provider: 'SEPAY',
              providerTransactionId: code || gateway,
              paidAt: new Date(transactionDate || Date.now()),
              updatedAt: new Date()
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
              updatedAt: new Date()
            },
          });
        } else {
          // Số tiền không đủ
          await (tx as any).payment.update({
            where: { id: payment.id },
            data: {
              status: 'PARTIAL_SUCCESS', // Trạng thái tùy chỉnh nếu cần
              provider: 'SEPAY',
              updatedAt: new Date()
            },
          });
        }
      });

      return { status: 'success', message: 'Payment processed' };
    } catch (error) {
      console.error('Lỗi xử lý SePay Webhook:', error);
      return { status: 'error', message: 'Internal Error' };
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

  /**
   * Hủy giao dịch
   */
  static async cancelPayment(paymentCode: string) {
    const payment = await (prisma as any).payment.findUnique({
      where: { paymentCode }
    });

    if (!payment) throw new Error('Không tìm thấy giao dịch');
    if (payment.status !== 'PENDING') throw new Error('Không thể hủy giao dịch đã xử lý');

    return await (prisma as any).payment.update({
      where: { paymentCode },
      data: { status: 'CANCELLED' }
    });
  }
}
