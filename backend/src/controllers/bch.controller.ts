import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

export const createBchAccount = async (req: Request, res: Response) => {
  const requestUser = (req as any).user || {};
  const requestRole = String(requestUser.role || '').toUpperCase();
  const { username, password, name, email, phone, class_id, role, position, teachingSubjectIds } = req.body;
  const normalizedRole = requestRole === 'BCH' ? 'BCH' : String(role || 'BCH').toUpperCase();
  const subjectIds = Array.isArray(teachingSubjectIds) ? teachingSubjectIds.map(Number).filter(id => !isNaN(id)) : [];
  const normalizedClassId = requestRole === 'BCH' ? String(requestUser.class_id || '').trim() : String(class_id || '').trim();

  if (!username || !String(username).trim() || !name || !String(name).trim()) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  if (!['QTV', 'LECTURER', 'BCH'].includes(normalizedRole)) {
    return res.status(400).json({ message: 'Vai trò không hợp lệ' });
  }

  if (requestRole === 'BCH' && normalizedRole !== 'BCH') {
    return res.status(403).json({ message: 'BCH chỉ được tạo tài khoản BCH trong lớp của mình' });
  }

  if (requestRole === 'BCH' && !normalizedClassId) {
    return res.status(403).json({ message: 'Tài khoản BCH chưa được gán lớp quản lý' });
  }

  if (normalizedRole === 'LECTURER' && subjectIds.length === 0) {
    return res.status(400).json({ message: 'Giảng viên phải có ít nhất một môn dạy' });
  }

  if (normalizedRole === 'BCH' && !normalizedClassId) {
    return res.status(400).json({ message: 'BCH phải được gán lớp quản lý' });
  }

  if (normalizedRole === 'BCH' && !position) {
    return res.status(400).json({ message: 'BCH phải có chức vụ' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password || '1234', 10);

    const newUser = await (prisma as any).$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          username: String(username).trim(),
          password: hashedPassword,
          name: String(name).trim(),
          email: email ? String(email).trim() : null,
          phone: phone ? String(phone).trim() : null,
          position: position ? String(position).trim() : null,
          class_id: normalizedClassId || null,
          role: normalizedRole as any,
          updatedAt: new Date()
        }
      });

      if (normalizedRole === 'LECTURER' && subjectIds.length > 0) {
        await tx.teachingassignment.createMany({
          data: subjectIds.map(id => ({
            userId: user.id,
            subjectId: id
          }))
        });
      }

      return user;
    });

    const createdAccount = await (prisma as any).user.findUnique({
      where: { id: newUser.id },
      include: {
        teachingassignment: { include: { subject: true } },
        bchassignment: true
      }
    });

    res.json(createdAccount || newUser);
  } catch (error: any) {
    console.error('createBchAccount detailed error:', error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || '';
      if (String(target).includes('email')) {
        return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác' });
      }
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Môn dạy hoặc lớp quản lý không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo tài khoản', details: error.message });
  }
};

export const getBchAccounts = async (req: Request, res: Response) => {
  const requestUser = (req as any).user || {};
  const requestRole = String(requestUser.role || '').toUpperCase();
  const { class_id, role } = req.query;

  try {
    const where: any = {
      role: {
        in: ['QTV', 'LECTURER', 'BCH']
      }
    };

    if (requestRole === 'BCH') {
      where.role = 'BCH';
      where.class_id = String(requestUser.class_id || '');
    } else if (role) {
      where.role = String(role).toUpperCase();
    }

    if (requestRole !== 'BCH' && class_id) {
      where.class_id = String(class_id);
    }

    const users = await (prisma as any).user.findMany({
      where,
      include: {
        teachingassignment: {
          include: {
            subject: true
          }
        },
        bchassignment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const usersWithAssignments = users.map((user: any) => ({
      ...user,
      assignments: user.bchassignment || [],
      teachingSubjects: Array.isArray(user.teachingassignment)
        ? user.teachingassignment.map((assignment: any) => assignment.subject).filter(Boolean)
        : []
    }));

    res.json(usersWithAssignments);
  } catch (error: any) {
    console.error('getBchAccounts error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.message
    });
  }
};

export const updateBchAccount = async (req: Request, res: Response) => {
  const requestUser = (req as any).user || {};
  const requestRole = String(requestUser.role || '').toUpperCase();
  const { id } = req.params;
  const { name, email, phone, class_id, password, role, position, teachingSubjectIds } = req.body;

  try {
    const existingUser = await (prisma as any).user.findUnique({ where: { id: Number(id) } });

    if (!existingUser) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (requestRole === 'BCH' && String(existingUser.class_id || '') !== String(requestUser.class_id || '')) {
      return res.status(403).json({ message: 'BCH chỉ được chỉnh sửa tài khoản trong lớp của mình' });
    }

    const normalizedRole = String(role || existingUser.role).toUpperCase();
    const subjectIds = Array.isArray(teachingSubjectIds) ? teachingSubjectIds.map(Number).filter(id => !isNaN(id)) : [];

    if (!['QTV', 'LECTURER', 'BCH'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    if (requestRole === 'BCH' && normalizedRole !== 'BCH') {
      return res.status(403).json({ message: 'BCH chỉ được quản lý tài khoản BCH' });
    }

    if (requestRole === 'BCH' && class_id && String(class_id) !== String(requestUser.class_id || '')) {
      return res.status(403).json({ message: 'BCH chỉ được gán lớp của mình' });
    }

    if (normalizedRole === 'LECTURER' && subjectIds.length === 0) {
      return res.status(400).json({ message: 'Giảng viên phải có ít nhất một môn dạy' });
    }

    if (normalizedRole === 'BCH' && !class_id && !existingUser.class_id) {
      return res.status(400).json({ message: 'BCH phải được gán lớp quản lý' });
    }

    if (normalizedRole === 'BCH' && !position && !existingUser.position) {
      return res.status(400).json({ message: 'BCH phải có chức vụ' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const finalClassId = requestRole === 'BCH' ? String(requestUser.class_id || '') : (class_id ? String(class_id).trim() : null);

    const updatedUser = await (prisma as any).$transaction(async (tx: any) => {
      const user = await tx.user.update({
        where: { id: Number(id) },
        data: {
          name: name ? String(name).trim() : existingUser.name,
          email: email ? String(email).trim() : null,
          phone: phone ? String(phone).trim() : null,
          position: position ? String(position).trim() : null,
          class_id: finalClassId,
          ...(role ? { role: normalizedRole as any } : {}),
          ...(hashedPassword ? { password: hashedPassword } : {}),
          updatedAt: new Date()
        }
      });

      if (normalizedRole !== 'LECTURER') {
        await tx.teachingassignment.deleteMany({ where: { userId: user.id } });
      }

      if (normalizedRole !== 'BCH') {
        await tx.bchassignment.deleteMany({ where: { bchUserId: user.id } });
      }

      if (normalizedRole === 'LECTURER' && subjectIds.length > 0) {
        await tx.teachingassignment.deleteMany({ where: { userId: user.id } });
        await tx.teachingassignment.createMany({
          data: subjectIds.map(id => ({
            userId: user.id,
            subjectId: id
          }))
        });
      }

      return user;
    });

    const account = await (prisma as any).user.findUnique({
      where: { id: updatedUser.id },
      include: {
        teachingassignment: { include: { subject: true } },
        bchassignment: true
      }
    });

    res.json(account || updatedUser);
  } catch (error: any) {
    console.error('updateBchAccount error:', error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || '';
      if (String(target).includes('email')) {
        return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác' });
      }
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Môn dạy hoặc lớp quản lý không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật tài khoản', details: error.message });
  }
};

export const deleteBchAccount = async (req: Request, res: Response) => {
  const requestUser = (req as any).user || {};
  const requestRole = String(requestUser.role || '').toUpperCase();
  const { id } = req.params;

  try {
    const targetUser = await (prisma as any).user.findUnique({ where: { id: Number(id) } });

    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (requestRole === 'BCH' && String(targetUser.class_id || '') !== String(requestUser.class_id || '')) {
      return res.status(403).json({ message: 'BCH chỉ được xóa tài khoản trong lớp của mình' });
    }

    await (prisma as any).$transaction(async (tx: any) => {
      await tx.teachingassignment.deleteMany({ where: { userId: Number(id) } });
      await tx.bchassignment.deleteMany({ where: { bchUserId: Number(id) } });
      await tx.user.delete({ where: { id: Number(id) } });
    });

    res.json({ message: 'Tài khoản CBNT đã được xóa' });
  } catch (error: any) {
    console.error('deleteBchAccount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignStudents = async (req: Request, res: Response) => {
  const requestUser = (req as any).user || {};
  const requestRole = String(requestUser.role || '').toUpperCase();
  const { bchUserId, assignments } = req.body; 

  if (!bchUserId) {
    return res.status(400).json({ message: 'Thiếu ID tài khoản BCH' });
  }

  try {
    const targetUser = await (prisma as any).user.findUnique({ where: { id: Number(bchUserId) } });

    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (requestRole === 'BCH' && String(targetUser.class_id || '') !== String(requestUser.class_id || '')) {
      return res.status(403).json({ message: 'BCH chỉ được phân công trong lớp của mình' });
    }

    const targetUserId = Number(bchUserId);
    
    await prisma.$transaction(async (tx: any) => {
      await (tx as any).bchassignment.deleteMany({
        where: { bchUserId: targetUserId }
      });

      if (assignments && assignments.length > 0) {
        for (const a of assignments) {
          const classId = String(a.classId || '').trim();
          if (!classId) continue;
          if (requestRole === 'BCH' && classId !== String(requestUser.class_id || '')) continue;
          await (tx as any).bchassignment.create({
            data: {
              bchUserId: targetUserId,
              classId,
              fromOrder: parseInt(String(a.fromOrder)) || 0,
              toOrder: parseInt(String(a.toOrder)) || 0
            }
          });
        }
      }
    });

    res.json({ message: 'Cập nhật phân công thành công' });
  } catch (error: any) {
    console.error('Lỗi khi phân công:', error);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + error.message });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  const requestUser = (req as any).user || {};
  const requestRole = String(requestUser.role || '').toUpperCase();
  const { bchUserId } = req.params;

  try {
    const targetUser = await (prisma as any).user.findUnique({ where: { id: Number(bchUserId) } });

    if (!targetUser) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (requestRole === 'BCH' && String(targetUser.class_id || '') !== String(requestUser.class_id || '')) {
      return res.status(403).json({ message: 'BCH chỉ được xem phân công của lớp mình' });
    }

    const assignments = await (prisma as any).bchassignment.findMany({
      where: { bchUserId: Number(bchUserId) }
    });

    res.json(assignments);
  } catch (error: any) {
    console.error('getAssignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const exportAssignments = async (req: Request, res: Response) => {
  const requestUser = (req as any).user || {};
  const requestRole = String(requestUser.role || '').toUpperCase();
  const class_id = req.query.class_id || (requestRole === 'BCH' ? requestUser.class_id : null);

  if (!class_id) {
    return res.status(400).json({ message: 'Thiếu tham số class_id' });
  }

  try {
    const students = await prisma.student.findMany({
      where: { class_id: String(class_id) },
      orderBy: { order_number: 'asc' }
    });

    const assignments = await (prisma as any).bchassignment.findMany({
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
        bch_name: bchNames || ''
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
  } catch (error: any) {
    console.error('exportAssignments error:', error);
    res.status(500).json({ message: 'Lỗi server khi xuất file phân công' });
  }
};
