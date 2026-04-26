import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import ExcelJS from 'exceljs';

const checkConflicts = async (data: {
  room: string;
  teacher: string;
  classId: string;
  day: number;
  startPeriod: number;
  endPeriod: number;
  excludeId?: number;
}) => {
  const { room, teacher, classId, day, startPeriod, endPeriod, excludeId } = data;
  
  // Standardize room name
  const standardizedRoom = room.trim().toUpperCase();

  // Unified conflict query for Room, Teacher, or Class
  const conflicts: any[] = await prisma.$queryRaw`
    SELECT id, room, teacher, "classId", subject 
    FROM "Timetable" 
    WHERE "day" = ${parseInt(day as any)} 
    AND (
      ("startPeriod" <= ${parseInt(startPeriod as any)} AND "endPeriod" >= ${parseInt(startPeriod as any)})
      OR ("startPeriod" <= ${parseInt(endPeriod as any)} AND "endPeriod" >= ${parseInt(endPeriod as any)})
      OR (${parseInt(startPeriod as any)} <= "startPeriod" AND ${parseInt(endPeriod as any)} >= "startPeriod")
    )
    ${excludeId ? Prisma.sql`AND id != ${excludeId}` : Prisma.empty}
  `;

  for (const conflict of conflicts) {
    if (conflict.room.trim().toUpperCase() === standardizedRoom) {
      return `Phòng ${conflict.room} đã có lịch dạy môn ${conflict.subject}`;
    }
    if (conflict.teacher.trim().toLowerCase() === teacher.trim().toLowerCase()) {
      return `Giảng viên ${conflict.teacher} đã có lịch dạy vào thời gian này`;
    }
    if (conflict.classId === classId) {
      return `Lớp ${conflict.classId} đã có lịch học vào thời gian này`;
    }
  }

  return null;
};

export const getAllTimetables = async (req: any, res: Response) => {
  try {
    const { semesterId, classId, teacher, room, subject, date } = req.query;
    const user = req.user;
    
    let query = 'SELECT * FROM "Timetable" WHERE 1=1';
    const params: any[] = [];
    
    // Role-based filtering: LECTURER only sees their own schedule
    if (user?.role === 'LECTURER') {
      const searchTerms = [user.name, user.username].filter(Boolean);
      if (searchTerms.length > 0) {
        const conditions = searchTerms.map(term => {
          params.push(`%${term}%`);
          return `"teacher" ILIKE $${params.length}`;
        });
        query += ` AND (${conditions.join(' OR ')})`;
      }
    } else if (teacher) {
      params.push(`%${teacher}%`);
      query += ` AND "teacher" ILIKE $${params.length}`;
    }
    
    if (semesterId) {
      params.push(semesterId);
      query += ` AND "semesterId" = $${params.length}`;
    }
    if (classId) {
      params.push(`%${classId}%`);
      query += ` AND "classId" ILIKE $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND "startDate" <= $${params.length}::timestamp`;
    }
    if (room) {
      params.push(`%${room}%`);
      query += ` AND "room" ILIKE $${params.length}`;
    }
    if (subject) {
      params.push(`%${subject}%`);
      query += ` AND "subject" ILIKE $${params.length}`;
    }
    
    query += ' ORDER BY "day" ASC, "startPeriod" ASC';
    
    const timetables = await prisma.$queryRawUnsafe(query, ...params);
    res.json(timetables);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTimetable = async (req: Request, res: Response) => {
  try {
    const { subject, teacher, room, day, startPeriod, endPeriod, classId, semesterId, type, startDate } = req.body;
    
    const conflictError = await checkConflicts({
      room, teacher, classId, day, startPeriod, endPeriod
    });

    if (conflictError) {
      return res.status(400).json({ error: conflictError });
    }

    await prisma.$executeRaw`
      INSERT INTO "Timetable" (subject, teacher, room, day, "startPeriod", "endPeriod", "classId", "semesterId", type, "startDate", "updatedAt")
      VALUES (${subject}, ${teacher}, ${room.trim().toUpperCase()}, ${parseInt(day)}, ${parseInt(startPeriod)}, ${parseInt(endPeriod)}, ${classId}, ${semesterId}, ${type || 'offline'}, ${startDate ? new Date(startDate) : new Date()}, NOW())
    `;

    res.json({ message: 'Tạo thời khóa biểu thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTimetable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subject, teacher, room, day, startPeriod, endPeriod, classId, semesterId, type, startDate } = req.body;
    
    const conflictError = await checkConflicts({
      room, teacher, classId, day, startPeriod, endPeriod, excludeId: parseInt(id as string)
    });

    if (conflictError) {
      return res.status(400).json({ error: conflictError });
    }

    await prisma.$executeRaw`
      UPDATE "Timetable" 
      SET subject = ${subject}, teacher = ${teacher}, room = ${room.trim().toUpperCase()}, 
          day = ${parseInt(day)}, "startPeriod" = ${parseInt(startPeriod)}, "endPeriod" = ${parseInt(endPeriod)}, 
          "classId" = ${classId}, "semesterId" = ${semesterId}, type = ${type || 'offline'}, 
          "startDate" = ${startDate ? new Date(startDate) : new Date()}, "updatedAt" = NOW()
      WHERE id = ${parseInt(id as string)}
    `;
    
    res.json({ message: 'Cập nhật thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTimetable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.$executeRaw`DELETE FROM "Timetable" WHERE id = ${parseInt(id as string)}`;
    res.json({ message: 'Xóa thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLecturers = async (req: Request, res: Response) => {
  try {
    const lecturers = await prisma.$queryRawUnsafe(
      'SELECT "id", "name", "username" FROM "User" WHERE "role"::text = $1',
      'LECTURER'
    );
    res.json(lecturers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const exportTimetables = async (req: Request, res: Response) => {
  try {
    const timetables: any[] = await prisma.$queryRaw`SELECT * FROM "Timetable" ORDER BY "day" ASC, "startPeriod" ASC`;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Thời khóa biểu');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Môn học', key: 'subject', width: 30 },
      { header: 'Giảng viên', key: 'teacher', width: 25 },
      { header: 'Phòng', key: 'room', width: 15 },
      { header: 'Thứ', key: 'day', width: 10 },
      { header: 'Tiết bắt đầu', key: 'startPeriod', width: 15 },
      { header: 'Tiết kết thúc', key: 'endPeriod', width: 15 },
      { header: 'Lớp', key: 'classId', width: 20 },
      { header: 'Học kỳ', key: 'semesterId', width: 20 },
      { header: 'Loại', key: 'type', width: 15 },
      { header: 'Ngày bắt đầu', key: 'startDate', width: 20 },
    ];
    
    timetables.forEach(t => worksheet.addRow(t));
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ThoiKhoaBieu.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const importTimetables = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng tải lên file Excel' });
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    
    const rows: any[] = [];
    worksheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const values = row.values as any[];
      rows.push({
        subject: values[2],
        teacher: values[3],
        room: values[4],
        day: parseInt(values[5]),
        startPeriod: parseInt(values[6]),
        endPeriod: parseInt(values[7]),
        classId: values[8],
        semesterId: values[9],
        type: values[10] || 'offline',
        startDate: values[11] ? new Date(values[11]) : new Date()
      });
    });
    
    const results = {
      success: 0,
      errors: [] as string[]
    };

    for (const data of rows) {
      const conflictError = await checkConflicts(data);
      if (conflictError) {
        results.errors.push(`Dòng ${results.success + results.errors.length + 2}: ${conflictError}`);
        continue;
      }

      await prisma.$executeRaw`
        INSERT INTO "Timetable" (subject, teacher, room, day, "startPeriod", "endPeriod", "classId", "semesterId", type, "startDate", "updatedAt")
        VALUES (${data.subject}, ${data.teacher}, ${data.room.trim().toUpperCase()}, ${data.day}, ${data.startPeriod}, ${data.endPeriod}, ${data.classId}, ${data.semesterId}, ${data.type}, ${data.startDate}, NOW())
      `;
      results.success++;
    }
    
    res.json({ 
      message: `Đã import thành công ${results.success} tiết học.`,
      errors: results.errors.length > 0 ? results.errors : undefined
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

import * as timetableService from '../services/timetable.service';

export const checkConflictsBatch = async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    const conflicts = await timetableService.checkConflicts(events);
    res.json({ 
      isValid: conflicts.length === 0,
      conflicts 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkCreateSchedules = async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    
    // Final validation before saving
    const conflicts = await timetableService.checkConflicts(events);
    if (conflicts.length > 0) {
      return res.status(400).json({ error: 'Vẫn còn xung đột lịch học', conflicts });
    }

    const results = await timetableService.bulkCreateSchedules(events);
    res.status(201).json({ 
      message: `Đã tạo thành công ${results.length} tiết học.`,
      data: results 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
export const getSuggestedSubjects = async (req: Request, res: Response) => {
  try {
    const { classId, semesterNumber } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'Thiếu mã lớp' });
    }

    // 1. Tìm lớp và ngành của lớp đó (Ép kiểu any để bỏ qua lỗi type Prisma chưa cập nhật)
    const classData = await (prisma as any).class.findUnique({
      where: { name: classId as string },
      include: {
        major: {
          include: {
            curriculumSemesters: {
              where: semesterNumber ? { semesterNumber: parseInt(semesterNumber as string) } : {},
              include: {
                subjects: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!classData || !classData.major) {
      return res.status(404).json({ error: 'Không tìm thấy lớp hoặc ngành của lớp này' });
    }

    // 2. Thu thập danh sách môn học từ chương trình khung
    const suggestedSubjects = (classData.major.curriculumSemesters || []).flatMap((cs: any) => 
      (cs.subjects || []).map((curSub: any) => ({
        id: curSub.subject?.id,
        code: curSub.subject?.code,
        name: curSub.subject?.name,
        credits: curSub.subject?.credits,
        semesterName: cs.name,
        semesterNumber: cs.semesterNumber
      }))
    );

    res.json({
      major: classData.major.name,
      subjects: suggestedSubjects
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
