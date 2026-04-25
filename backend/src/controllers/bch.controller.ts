import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

export const createBchAccount = async (req: Request, res: Response) => {
  const { username, password, name, email, phone, class_id, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password || '1234', 10);
    await prisma.$executeRawUnsafe(
      'INSERT INTO "User" ("username", "password", "name", "email", "phone", "class_id", "role", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, CAST($7 AS "Role"), NOW(), NOW())',
      username, hashedPassword, name, email || null, phone || null, class_id || null, role || 'BCH'
    );
    
    const users: any[] = await prisma.$queryRawUnsafe(
      'SELECT * FROM "User" WHERE "username" = $1 LIMIT 1',
      username
    );
    res.json(users[0]);
  } catch (error: any) {
    console.error('createBchAccount detailed error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBchAccounts = async (req: Request, res: Response) => {
  const { class_id, role } = req.query;

  try {
    let query = 'SELECT * FROM "User" WHERE role::text IN (\'QTV\', \'LECTURER\', \'BCH\')';
    const params: any[] = [];

    if (role) {
      query = 'SELECT * FROM "User" WHERE role::text = $1';
      params.push(role);
    }

    if (class_id) {
      query += params.length > 0 ? ' AND class_id = $2' : ' AND class_id = $1';
      params.push(class_id);
    }

    const users = await prisma.$queryRawUnsafe(query, ...params);
    res.json(users);
  } catch (error) {
    console.error('getBchAccounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBchAccount = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, class_id, password, role } = req.body;

  try {
    let query = 'UPDATE "User" SET "name" = $1, "email" = $2, "phone" = $3, "class_id" = $4, "updatedAt" = NOW()';
    const params: any[] = [name, email || null, phone || null, class_id || null];

    if (role) {
      params.push(role);
      query += `, "role" = CAST($${params.length} AS "Role")`;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      params.push(hashedPassword);
      query += `, "password" = $${params.length}`;
    }

    params.push(Number(id));
    query += ` WHERE "id" = $${params.length}`;

    await prisma.$queryRawUnsafe(query, ...params);
    
    const users: any[] = await prisma.$queryRawUnsafe('SELECT * FROM "User" WHERE "id" = $1 LIMIT 1', Number(id));
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBchAccount = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await (prisma as any).$transaction([
      (prisma as any).bchAssignment.deleteMany({ where: { bchUserId: Number(id) } }),
      (prisma as any).user.delete({ where: { id: Number(id) } })
    ]);
    res.json({ message: 'BCH account deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignStudents = async (req: Request, res: Response) => {
  const { bchUserId, assignments } = req.body; 

  try {
    await (prisma as any).bchAssignment.deleteMany({
      where: { bchUserId: Number(bchUserId) }
    });

    const created = await (prisma as any).bchAssignment.createMany({
      data: assignments.map((a: any) => ({
        bchUserId: Number(bchUserId),
        classId: a.classId,
        fromOrder: Number(a.fromOrder),
        toOrder: Number(a.toOrder)
      }))
    });

    res.json({ message: 'Assignments updated', count: created.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  const { bchUserId } = req.params;

  try {
    const assignments = await (prisma as any).bchAssignment.findMany({
      where: { bchUserId: Number(bchUserId) }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const exportBchAssignments = async (req: Request, res: Response) => {
  const { class_id } = req.query;

  if (!class_id) {
    return res.status(400).json({ message: 'Thiếu tham số class_id' });
  }

  try {
    const students = await prisma.student.findMany({
      where: { class_id: String(class_id) },
      orderBy: { order_number: 'asc' }
    });

    const assignments = await (prisma as any).bchAssignment.findMany({
      where: { classId: String(class_id) },
      include: { bchUser: true }
    });

    const ExcelJS = await import('exceljs');
    const ExcelJSModule = (ExcelJS.default || ExcelJS) as any;
    const workbook = new ExcelJSModule.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách phân công');

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'MSSV', key: 'student_code', width: 15 },
      { header: 'Họ tên', key: 'name', width: 30 },
      { header: 'BCH Phân công', key: 'bch_name', width: 25 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };

    students.forEach((student: any) => {
      const order = student.order_number;
      const matchedAssignments = assignments.filter((a: any) => 
        order >= a.fromOrder && order <= a.toOrder
      );
      
      const bchNames = matchedAssignments.map((a: any) => a.bchUser.name).join(', ');

      worksheet.addRow({
        stt: order,
        student_code: student.student_code,
        name: student.name,
        bch_name: bchNames || '' // Bỏ trống nếu không được phân công cụ thể
      });
    });

    // Add a note at the bottom
    worksheet.addRow([]);
    const noteRow = worksheet.addRow(['Ghi chú: Những sinh viên bỏ trống phần BCH Phân công sẽ do toàn bộ BCH lớp cùng chấm.']);
    noteRow.font = { italic: true, color: { argb: 'FF6B7280' } };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="phan-cong-${class_id}.xlsx"`);
    res.status(200).send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi xuất file phân công' });
  }
};
