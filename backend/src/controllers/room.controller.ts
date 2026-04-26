// @ts-nocheck
import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(rooms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, capacity, type } = req.body;
    const room = await prisma.room.create({
      data: { name, capacity: parseInt(capacity), type }
    });
    res.json(room);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, type } = req.body;
    const room = await prisma.room.update({
      where: { id: parseInt(id as string) },
      data: { name, capacity: parseInt(capacity), type }
    });
    res.json(room);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.room.delete({
      where: { id: parseInt(id as string) }
    });
    res.json({ message: 'Xóa phòng thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableRooms = async (req: Request, res: Response) => {
  try {
    const { day, startPeriod, endPeriod, date } = req.query;
    
    if (!day || !startPeriod || !endPeriod) {
      return res.status(400).json({ error: 'Thiếu thông tin ngày và tiết học' });
    }

    const d = parseInt(day as string);
    const sP = parseInt(startPeriod as string);
    const eP = parseInt(endPeriod as string);

    // 1. Check conflicts in Timetable (weekly recurring)
    const occupiedInTimetable: any[] = await prisma.$queryRaw`
      SELECT DISTINCT room FROM "Timetable"
      WHERE "day" = ${d}
      AND (
        ("startPeriod" <= ${sP} AND "endPeriod" >= ${sP})
        OR ("startPeriod" <= ${eP} AND "endPeriod" >= ${eP})
        OR (${sP} <= "startPeriod" AND ${eP} >= "startPeriod")
      )
    `;

    // 2. Check conflicts in RoomBorrowing (specific date)
    let occupiedInBorrowing: any[] = [];
    if (date) {
      occupiedInBorrowing = await prisma.roomBorrowing.findMany({
        where: {
          date: new Date(date as string),
          status: 'APPROVED',
          OR: [
            { AND: [{ startPeriod: { lte: sP } }, { endPeriod: { gte: sP } }] },
            { AND: [{ startPeriod: { lte: eP } }, { endPeriod: { gte: eP } }] },
            { AND: [{ startPeriod: { gte: sP } }, { endPeriod: { lte: eP } }] }
          ]
        },
        select: { roomName: true }
      });
    }

    // Standardize all occupied names for comparison
    const occupiedRoomNames = new Set([
      ...occupiedInTimetable.map(r => r.room.trim().toUpperCase()),
      ...occupiedInBorrowing.map(r => r.roomName.trim().toUpperCase())
    ]);

    const allRooms = await prisma.room.findMany();
    const availableRooms = allRooms.filter(r => !occupiedRoomNames.has(r.name.trim().toUpperCase()));

    res.json(availableRooms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
