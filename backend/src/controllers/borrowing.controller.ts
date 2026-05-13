// @ts-nocheck
import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllBorrowings = async (req: Request, res: Response) => {
  try {
    const borrowings = await prisma.roomBorrowing.findMany({
      include: { room: true },
      orderBy: { date: 'desc' }
    });
    res.json(borrowings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBorrowing = async (req: Request, res: Response) => {
  try {
    const { roomId, roomName, borrowerName, purpose, date, startPeriod, endPeriod } = req.body;
    
    // Check for conflicts in Timetable
    const day = new Date(date).getDay() + 1; // JS 0-6 to 1-7 (wait, our 2-8 mapping)
    // Actually our day mapping is 2=Thứ 2, ..., 8=Chủ nhật.
    // JS getDay(): 0=CN, 1=T2, ..., 6=T7.
    let mappedDay = day === 1 ? 8 : day; // 1 (Mon) stays 2? No.
    // JS: 0=CN -> 8
    // JS: 1=T2 -> 2
    // JS: 2=T3 -> 3 ...
    const jsDay = new Date(date).getDay();
    const timetableDay = jsDay === 0 ? 8 : jsDay + 1;

    const timetableConflicts: any[] = await prisma.$queryRaw`
      SELECT id FROM timetable 
      WHERE room = ${roomName} AND day = ${timetableDay} 
      AND (
        (startPeriod <= ${parseInt(startPeriod)} AND endPeriod >= ${parseInt(startPeriod)})
        OR (startPeriod <= ${parseInt(endPeriod)} AND endPeriod >= ${parseInt(endPeriod)})
        OR (${parseInt(startPeriod)} <= startPeriod AND ${parseInt(endPeriod)} >= startPeriod)
      )
      LIMIT 1
    `;

    if (timetableConflicts.length > 0) {
      return res.status(400).json({ error: 'Phòng này đã có lịch học cố định vào thời gian này' });
    }

    // Check for conflicts in other Borrowings
    const borrowingConflicts = await prisma.roomBorrowing.findFirst({
      where: {
        roomName,
        date: new Date(date),
        status: 'APPROVED',
        OR: [
          { AND: [{ startPeriod: { lte: parseInt(startPeriod) } }, { endPeriod: { gte: parseInt(startPeriod) } }] },
          { AND: [{ startPeriod: { lte: parseInt(endPeriod) } }, { endPeriod: { gte: parseInt(endPeriod) } }] },
          { AND: [{ startPeriod: { gte: parseInt(startPeriod) } }, { endPeriod: { lte: parseInt(endPeriod) } }] }
        ]
      }
    });

    if (borrowingConflicts) {
      return res.status(400).json({ error: 'Phòng này đã có người mượn vào thời gian này' });
    }

    const borrowing = await prisma.roomBorrowing.create({
      data: {
        roomId: parseInt(roomId),
        roomName,
        borrowerName,
        purpose,
        date: new Date(date),
        startPeriod: parseInt(startPeriod),
        endPeriod: parseInt(endPeriod),
        status: 'APPROVED',
        updatedAt: new Date()
      }
    });
    res.json(borrowing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBorrowingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const borrowing = await prisma.roomBorrowing.update({
      where: { id: parseInt(id as string) },
      data: { 
        status,
        updatedAt: new Date()
      }
    });
    res.json(borrowing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBorrowing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.roomBorrowing.delete({
      where: { id: parseInt(id as string) }
    });
    res.json({ message: 'Xóa yêu cầu mượn phòng thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
