import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    const settings = await (prisma as any).systemSetting.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data }
    });
    
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
