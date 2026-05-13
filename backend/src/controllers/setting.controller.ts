import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await (prisma as any).systemSetting.findFirst();
    
    if (!settings) {
      // Khởi tạo cài đặt mặc định nếu chưa có
      settings = await (prisma as any).systemSetting.create({
        data: {
          id: 1,
          schoolName: "Trường Đại học Công nghệ",
          maintenanceMode: false,
          registrationOpen: false
        }
      });
    }
    
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Lấy cài đặt cũ để biết đơn giá cũ (dùng cho việc quy đổi học phí cũ)
    const oldSettings = await (prisma as any).systemSetting.findFirst();
    const oldPrice = oldSettings?.tuitionPricePerCredit || 500000;

    const settings = await (prisma as any).systemSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data }
    });

    // Nếu cập nhật đơn giá tín chỉ, cập nhật toàn bộ môn học để đồng bộ
    if (data.tuitionPricePerCredit !== undefined) {
      const newPrice = Number(data.tuitionPricePerCredit);
      
      // 1. Cập nhật toàn bộ môn học
      await prisma.subject.updateMany({
        data: {
          pricePerCredit: newPrice,
          updatedAt: new Date()
        }
      });

      // 2. Cập nhật lại toàn bộ học phí chưa hoàn thành (UNPAID/PARTIAL_PAID)
      // Công thức: totalAmount mới = (totalAmount cũ / price cũ) * price mới
      // Chỉ thực hiện nếu price cũ > 0
      if (oldPrice > 0 && oldPrice !== newPrice) {
        const factor = newPrice / oldPrice;
        
        // Lấy danh sách học phí chưa hoàn thành
        const unpaidTuitions = await prisma.tuition.findMany({
          where: { status: { in: ['UNPAID', 'PARTIAL_PAID'] } }
        });

        for (const t of unpaidTuitions) {
          const newTotalAmount = Math.round(t.totalAmount * factor);
          const newRemainingAmount = Math.max(0, newTotalAmount - t.paidAmount);
          const newStatus = newTotalAmount === 0 ? 'PAID' : (newRemainingAmount === 0 ? 'PAID' : (t.paidAmount > 0 ? 'PARTIAL_PAID' : 'UNPAID'));

          await prisma.tuition.update({
            where: { id: t.id },
            data: {
              totalAmount: newTotalAmount,
              remainingAmount: newRemainingAmount,
              status: newStatus,
              updatedAt: new Date()
            }
          });
        }
      }
    }
    
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
