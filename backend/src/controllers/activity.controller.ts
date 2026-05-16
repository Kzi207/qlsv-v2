import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import crypto from 'crypto';
import { logAudit } from '../utils/logger';
import type { AuthRequest } from '../middleware/auth.middleware';

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, points, sectionId, criterionId, semesterId, classId } = req.body;
    const qrToken = crypto.randomBytes(16).toString('hex');
    const pointsInt = parseInt(String(points)) || 0;

    await prisma.$executeRaw`
      INSERT INTO activityattendancesession 
      (title, category, points, qrToken, isActive, createdAt, sectionId, criterionId, semesterId, classId)
      VALUES 
      (${title}, ${category}, ${pointsInt}, ${qrToken}, true, NOW(), ${sectionId}, ${criterionId}, ${semesterId || null}, ${classId || null})
    `;

    const sessions: any[] = await prisma.$queryRaw`
      SELECT * FROM activityattendancesession WHERE qrToken = ${qrToken} LIMIT 1
    `;

    await logAudit({
      userId: Number(req.user?.id),
      action: 'CREATE_QR_SESSION',
      targetType: 'ActivitySession',
      targetId: String(sessions[0].id),
      details: { title, points },
      req
    });

    res.json(sessions[0]);
  } catch (error: any) {
    console.error('Error in createSession:', error);
    res.status(500).json({ error: error.message });
  }
};

export const scanQR = async (req: AuthRequest, res: Response) => {
  try {
    const { qrToken } = req.body;
    const user = (req as any).user;

    if (!user || !user.studentId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin sinh viên' });
    }

    const studentIdInt = parseInt(String(user.studentId));

    const students: any[] = await prisma.$queryRaw`
      SELECT id, class_id FROM student WHERE id = ${studentIdInt} LIMIT 1
    `;
    const student = students[0];

    if (!student) {
      return res.status(404).json({ error: 'Sinh viên không tồn tại' });
    }

    const sessions: any[] = await prisma.$queryRaw`
      SELECT * FROM activityattendancesession WHERE qrToken = ${qrToken} LIMIT 1
    `;
    const session = sessions[0];

    if (!session || !session.isActive) {
      return res.status(404).json({ error: 'Mã QR không tồn tại hoặc đã hết hạn' });
    }

    if (session.classId && student.class_id !== session.classId) {
      return res.status(403).json({ error: `Mã QR này chỉ dành cho lớp ${session.classId}. Bạn thuộc lớp ${student.class_id}.` });
    }

    const existing: any[] = await prisma.$queryRaw`
      SELECT * FROM activityattendancerecord 
      WHERE sessionId = ${session.id} AND studentId = ${student.id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Bạn đã quét mã này rồi' });
    }

    await prisma.$executeRaw`
      INSERT INTO activityattendancerecord (sessionId, studentId, points, scannedAt)
      VALUES (${session.id}, ${student.id}, ${session.points}, NOW())
    `;

    // Tự động cộng điểm vào phiếu DRL nếu session có đủ thông tin
    if (session.criterionId && session.semesterId) {
      await syncActivityToTrainingScore(student.id, session.semesterId, session.criterionId, session.points);
    }

    await logAudit({
      userId: Number(user.id),
      action: 'SCAN_QR',
      targetType: 'ActivityRecord',
      targetId: String(session.id),
      details: { title: session.title, points: session.points },
      req
    });

    res.json({ message: 'Điểm danh thành công' });
  } catch (error: any) {
    console.error('Error in scanQR:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper để đồng bộ điểm từ hoạt động vào phiếu DRL
 */
async function syncActivityToTrainingScore(studentId: number, semesterId: string, criterionId: string, points: number) {
  try {
    const scoreRecord = await (prisma as any).trainingScore.findFirst({
      where: { student_id: studentId, semester_id: semesterId }
    });

    let details: Record<string, number> = {};
    if (scoreRecord && scoreRecord.details) {
      try {
        details = typeof scoreRecord.details === 'string' ? JSON.parse(scoreRecord.details) : scoreRecord.details;
      } catch {
        details = {};
      }
    }

    // Cộng điểm vào mục tiêu chí tương ứng (không vượt quá giới hạn nếu có, nhưng ở đây ta cứ cộng vào)
    // Lưu ý: Logic này giả định details lưu trữ điểm theo criterionId
    const currentPoints = Number(details[criterionId] || 0);
    details[criterionId] = currentPoints + points;

    // Tính toán lại các phần y_thuc, hoat_dong, ky_luat
    // Cấu trúc criterionId thường là X.Y (VD: 1.1, 2.1, 3.1...)
    let y_thuc = 0, hoat_dong = 0, ky_luat = 0;
    
    Object.entries(details).forEach(([cid, val]) => {
      const p = Number(val) || 0;
      if (cid.startsWith('1.')) y_thuc += p;
      else if (cid.startsWith('2.')) ky_luat += p;
      else if (cid.startsWith('3.') || cid.startsWith('4.') || cid.startsWith('5.')) hoat_dong += p;
    });

    // Giới hạn điểm tối đa theo quy định (Tham khảo từ training.controller)
    const secMaxPoints: number[] = [20, 25, 20, 25, 10]; // I: 20, II: 25, III: 20, IV: 25, V: 10
    const sec0 = secMaxPoints[0] ?? 20;
    const sec1 = secMaxPoints[1] ?? 25;
    const sec2 = secMaxPoints[2] ?? 20;
    const sec3 = secMaxPoints[3] ?? 25;
    const sec4 = secMaxPoints[4] ?? 10;

    y_thuc = Math.min(y_thuc, sec0);
    const hoat_dong_max = sec1 + sec2; // Phần III + IV
    hoat_dong = Math.min(hoat_dong, hoat_dong_max);
    const ky_luat_max = sec3 + sec4; // Phần II + V
    ky_luat = Math.min(ky_luat, ky_luat_max);
    
    const total = Math.min(y_thuc + hoat_dong + ky_luat, 100);

    if (scoreRecord) {
      // Update sử dụng raw SQL để tránh lỗi jsonb/string mismatch nếu có
      await prisma.$executeRaw`
        UPDATE trainingscore 
        SET details = ${JSON.stringify(details)},
            y_thuc = ${y_thuc},
            hoat_dong = ${hoat_dong},
            ky_luat = ${ky_luat},
            total = ${total},
            updatedAt = NOW()
        WHERE id = ${scoreRecord.id}
      `;
    } else {
      // Create new draft score
      await prisma.$executeRaw`
        INSERT INTO trainingscore (student_id, semester_id, y_thuc, hoat_dong, ky_luat, total, details, status, createdAt, updatedAt)
        VALUES (${studentId}, ${semesterId}, ${y_thuc}, ${hoat_dong}, ${ky_luat}, ${total}, ${JSON.stringify(details)}, 'DRAFT', NOW(), NOW())
      `;
    }
  } catch (err) {
    console.error('Error in syncActivityToTrainingScore:', err);
  }
}

export const getMyRecords = async (req: AuthRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });
    const studentIdInt = parseInt(String(user.studentId));

    // Get QR scanned records using Prisma Client
    const qrRecords = await prisma.activityattendancerecord.findMany({
      where: { studentId: studentIdInt },
      include: {
        session: true
      }
    });

    const formattedQrRecords = qrRecords.map((r: any) => ({
      id: r.id,
      points: r.points,
      scannedAt: r.scannedAt,
      session: r.session
    }));

    // Get Approved manual evidence using Prisma Client
    const manualRecords = await prisma.activityevidence.findMany({
      where: { 
        studentId: studentIdInt,
        status: 'APPROVED'
      }
    });

    // Transform manual records to match QR record structure for frontend
    const transformedManual = manualRecords.map((m: any) => ({
      id: `manual-${m.id}`,
      points: m.points,
      scannedAt: m.updatedAt, 
      session: {
        id: `manual-session-${m.id}`,
        title: m.adminTitle || m.title,
        sectionId: m.sectionId,
        criterionId: m.criterionId,
        semesterId: m.semesterId
      }
    }));

    const allRecords = [...formattedQrRecords, ...transformedManual].sort((a, b) => 
      new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
    );

    res.json(allRecords);
  } catch (error: any) {
    console.error('Error in getMyRecords:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSessionStats = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const stats: any[] = await prisma.$queryRaw`
      SELECT r.*, row_to_json(st) as student
      FROM activityattendancerecord r
      JOIN student st ON r.studentId = st.id
      WHERE r.sessionId = ${parseInt(String(sessionId), 10)}
    `;
    res.json(stats);
  } catch (error: any) {
    console.error('Error in getSessionStats:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { points } = req.body;
    await prisma.$executeRaw`
      UPDATE activityattendancerecord SET points = ${parseInt(String(points), 10) || 0} WHERE id = ${parseInt(String(id), 10)}
    `;
    res.json({ message: 'Cập nhật thành công' });
  } catch (error: any) {
    console.error('Error in updateRecord:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.$executeRaw`
      DELETE FROM activityattendancerecord WHERE id = ${parseInt(String(id), 10)}
    `;
    res.json({ message: 'Xóa bản ghi thành công' });
  } catch (error: any) {
    console.error('Error in deleteRecord:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const sessionId = parseInt(String(id), 10);

    await prisma.$executeRaw`DELETE FROM activityattendancerecord WHERE sessionId = ${sessionId}`;
    await prisma.$executeRaw`DELETE FROM activityattendancesession WHERE id = ${sessionId}`;

    res.json({ message: 'Xóa hoạt động thành công' });
  } catch (error: any) {
    console.error('Error in deleteSession:', error);
    res.status(500).json({ error: error.message });
  }
};

export const toggleSessionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    await prisma.$executeRaw`
      UPDATE activityattendancesession SET isActive = ${isActive} WHERE id = ${parseInt(String(id), 10)}
    `;
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (error: any) {
    console.error('Error in toggleSessionStatus:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllSessions = async (req: AuthRequest, res: Response) => {
  try {
    const user = (req as any).user;
    const isQtv = user?.role === 'QTV';
    const userClassId = user?.class_id;

    let query: any;
    if (isQtv) {
      query = prisma.$queryRaw`
        SELECT * FROM activityattendancesession ORDER BY createdAt DESC
      `;
    } else {
      // BCH only see sessions for their class OR global sessions (where classId is null)
      query = prisma.$queryRaw`
        SELECT * FROM activityattendancesession 
        WHERE classId = ${userClassId} OR classId IS NULL
        ORDER BY createdAt DESC
      `;
    }

    const sessions = await query;
    res.json(sessions);
  } catch (error: any) {
    console.error('Error in getAllSessions:', error);
    res.status(500).json({ error: error.message });
  }
};

// --- MANUAL EVIDENCE METHODS ---

export const uploadEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const { title, sectionId, criterionId, semesterId, points } = req.body;
    const user = (req as any).user;
    
    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });
    if (!req.file) return res.status(400).json({ error: 'Vui lòng tải lên ảnh minh chứng' });

    const studentIdInt = parseInt(String(user.studentId));
    const imageUrl = `/uploads/evidence/${req.file.filename}`;
    const pointsInt = points ? parseInt(String(points)) : null;

    await prisma.$executeRaw`
      INSERT INTO activityevidence (title, imageUrl, studentId, status, createdAt, updatedAt, sectionId, criterionId, semesterId, points)
      VALUES (${title}, ${imageUrl}, ${studentIdInt}, 'PENDING', NOW(), NOW(), ${sectionId || null}, ${criterionId || null}, ${semesterId || null}, ${pointsInt})
    `;

    await logAudit({
      userId: Number(user.id),
      action: 'UPLOAD_ACTIVITY_EVIDENCE',
      targetType: 'ActivityEvidence',
      targetId: title, // Use title as targetId since we don't have the new ID easily with $executeRaw
      details: { title, imageUrl },
      req
    });

    res.json({ message: 'Tải minh chứng thành công, vui lòng chờ duyệt' });
  } catch (error: any) {
    console.error('Error in uploadEvidence:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getMyEvidenceRequests = async (req: AuthRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });
    const studentIdInt = parseInt(String(user.studentId));

    const evidence = await prisma.$queryRaw`
      SELECT * FROM activityevidence 
      WHERE studentId = ${studentIdInt} 
      ORDER BY createdAt DESC
    `;

    res.json(evidence);
  } catch (error: any) {
    console.error('Error in getMyEvidenceRequests:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllPendingEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = Number(user?.id);
    const isQtv = user?.role === 'QTV';
    const userClassId = user?.class_id;

    if (isQtv) {
      const evidence = await (prisma as any).activityEvidence.findMany({
        where: { status: 'PENDING' },
        include: { student: true },
        orderBy: { createdAt: 'asc' }
      });
      return res.json(evidence);
    }

    // For BCH, we check both their profile class and their specific assignments
    const assignments: any[] = await (prisma as any).bchAssignment.findMany({
      where: { bchUserId: userId }
    });

    let where: any = { status: 'PENDING' };

    if (assignments.length > 0) {
      // Build filters for each assignment
      const assignmentFilters = assignments.map(a => ({
        student: {
          class_id: a.classId,
          order_number: {
            gte: a.fromOrder,
            lte: a.toOrder
          }
        }
      }));

      // Combine with OR, plus fallback to their own class if they have one
      const orFilters: any[] = [...assignmentFilters];
      if (userClassId) {
        orFilters.push({ student: { class_id: userClassId } });
      }

      where.OR = orFilters;
    } else if (userClassId) {
      where.student = { class_id: userClassId };
    } else {
      // No class and no assignments? Return empty
      return res.json([]);
    }

    const evidence = await (prisma as any).activityEvidence.findMany({
      where,
      include: { student: true },
      orderBy: { createdAt: 'asc' }
    });

    res.json(evidence);
  } catch (error: any) {
    console.error('Error in getAllPendingEvidence:', error);
    res.status(500).json({ error: error.message });
  }
};

export const reviewEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminTitle, points, sectionId, criterionId, semesterId } = req.body;

    await prisma.$executeRaw`
      UPDATE activityevidence 
      SET status = ${status}, 
          adminTitle = ${adminTitle || null}, 
          points = ${points ? parseInt(String(points)) : null}, 
          sectionId = ${sectionId || null}, 
          criterionId = ${criterionId || null},
          semesterId = ${semesterId || null},
          updatedAt = NOW()
      WHERE id = ${parseInt(String(id))}
    `;

    // Nếu duyệt minh chứng thành công, tự động cộng điểm vào phiếu DRL
    if (status === 'APPROVED' && criterionId && semesterId && points) {
      // Lấy studentId từ bản ghi minh chứng
      const evidence: any[] = await prisma.$queryRaw`SELECT studentId FROM activityevidence WHERE id = ${parseInt(String(id))} LIMIT 1`;
      if (evidence.length > 0) {
        await syncActivityToTrainingScore(evidence[0].studentId, semesterId, criterionId, parseInt(String(points)));
      }
    }

    await logAudit({
      userId: Number((req as any).user?.id),
      action: 'REVIEW_ACTIVITY_EVIDENCE',
      targetType: 'ActivityEvidence',
      targetId: String(id),
      details: { status, points, adminTitle },
      req
    });

    res.json({ message: 'Đã cập nhật trạng thái minh chứng' });
  } catch (error: any) {
    console.error('Error in reviewEvidence:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });

    const studentIdInt = parseInt(String(user.studentId));
    const evidenceId = parseInt(String(id));

    // Check ownership
    const evidence: any[] = await prisma.$queryRaw`
      SELECT id FROM activityevidence 
      WHERE id = ${evidenceId} AND studentId = ${studentIdInt}
      LIMIT 1
    `;

    if (evidence.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy minh chứng hoặc bạn không có quyền xóa' });
    }

    await prisma.$executeRaw`
      DELETE FROM activityevidence WHERE id = ${evidenceId}
    `;

    await logAudit({
      userId: Number(user.id),
      action: 'DELETE_ACTIVITY_EVIDENCE',
      targetType: 'ActivityEvidence',
      targetId: String(id),
      req
    });

    res.json({ message: 'Xóa minh chứng thành công' });
  } catch (error: any) {
    console.error('Error in deleteEvidence:', error);
    res.status(500).json({ error: error.message });
  }
};
