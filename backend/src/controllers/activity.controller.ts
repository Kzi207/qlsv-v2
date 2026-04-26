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
      INSERT INTO "ActivityAttendanceSession" 
      (title, category, points, "qrToken", "isActive", "createdAt", "sectionId", "criterionId", "semesterId", "classId")
      VALUES 
      (${title}, ${category}, ${pointsInt}, ${qrToken}, true, NOW(), ${sectionId}, ${criterionId}, ${semesterId || null}, ${classId || null})
    `;

    const sessions: any[] = await prisma.$queryRaw`
      SELECT * FROM "ActivityAttendanceSession" WHERE "qrToken" = ${qrToken} LIMIT 1
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
      SELECT id, class_id FROM "Student" WHERE id = ${studentIdInt} LIMIT 1
    `;
    const student = students[0];

    if (!student) {
      return res.status(404).json({ error: 'Sinh viên không tồn tại' });
    }

    const sessions: any[] = await prisma.$queryRaw`
      SELECT * FROM "ActivityAttendanceSession" WHERE "qrToken" = ${qrToken} LIMIT 1
    `;
    const session = sessions[0];

    if (!session || !session.isActive) {
      return res.status(404).json({ error: 'Mã QR không tồn tại hoặc đã hết hạn' });
    }

    if (session.classId && student.class_id !== session.classId) {
      return res.status(403).json({ error: `Mã QR này chỉ dành cho lớp ${session.classId}. Bạn thuộc lớp ${student.class_id}.` });
    }

    const existing: any[] = await prisma.$queryRaw`
      SELECT * FROM "ActivityAttendanceRecord" 
      WHERE "sessionId" = ${session.id} AND "studentId" = ${student.id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Bạn đã quét mã này rồi' });
    }

    await prisma.$executeRaw`
      INSERT INTO "ActivityAttendanceRecord" ("sessionId", "studentId", points, "scannedAt")
      VALUES (${session.id}, ${student.id}, ${session.points}, NOW())
    `;

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

export const getMyRecords = async (req: AuthRequest, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });
    const studentIdInt = parseInt(String(user.studentId));

    // Get QR scanned records
    const qrRecords: any[] = await prisma.$queryRaw`
      SELECT r.id, r.points, r."scannedAt", row_to_json(s) as session
      FROM "ActivityAttendanceRecord" r
      JOIN "ActivityAttendanceSession" s ON r."sessionId" = s.id
      WHERE r."studentId" = ${studentIdInt}
    `;

    // Get Approved manual evidence
    const manualRecords: any[] = await prisma.$queryRaw`
      SELECT id, points, "updatedAt" as "scannedAt", 
             "adminTitle" as title, "sectionId", "criterionId", "semesterId"
      FROM "ActivityEvidence"
      WHERE "studentId" = ${studentIdInt} AND status = 'APPROVED'
    `;

    // Transform manual records to match QR record structure for frontend
    const transformedManual = manualRecords.map(m => ({
      id: `manual-${m.id}`,
      points: m.points,
      scannedAt: m.scannedAt,
      session: {
        id: `manual-session-${m.id}`,
        title: m.title,
        sectionId: m.sectionId,
        criterionId: m.criterionId,
        semesterId: m.semesterId
      }
    }));

    const allRecords = [...qrRecords, ...transformedManual].sort((a, b) => 
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
      FROM "ActivityAttendanceRecord" r
      JOIN "Student" st ON r."studentId" = st.id
      WHERE r."sessionId" = ${parseInt(String(sessionId), 10)}
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
      UPDATE "ActivityAttendanceRecord" SET points = ${parseInt(String(points), 10) || 0} WHERE id = ${parseInt(String(id), 10)}
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
      DELETE FROM "ActivityAttendanceRecord" WHERE id = ${parseInt(String(id), 10)}
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

    await prisma.$executeRaw`DELETE FROM "ActivityAttendanceRecord" WHERE "sessionId" = ${sessionId}`;
    await prisma.$executeRaw`DELETE FROM "ActivityAttendanceSession" WHERE id = ${sessionId}`;

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
      UPDATE "ActivityAttendanceSession" SET "isActive" = ${isActive} WHERE id = ${parseInt(String(id), 10)}
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
        SELECT * FROM "ActivityAttendanceSession" ORDER BY "createdAt" DESC
      `;
    } else {
      // BCH only see sessions for their class OR global sessions (where classId is null)
      query = prisma.$queryRaw`
        SELECT * FROM "ActivityAttendanceSession" 
        WHERE "classId" = ${userClassId} OR "classId" IS NULL
        ORDER BY "createdAt" DESC
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
    const { title } = req.body;
    const user = (req as any).user;
    
    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });
    if (!req.file) return res.status(400).json({ error: 'Vui lòng tải lên ảnh minh chứng' });

    const studentIdInt = parseInt(String(user.studentId));
    const imageUrl = `/uploads/evidence/${req.file.filename}`;

    await prisma.$executeRaw`
      INSERT INTO "ActivityEvidence" (title, "imageUrl", "studentId", status, "createdAt", "updatedAt")
      VALUES (${title}, ${imageUrl}, ${studentIdInt}, 'PENDING', NOW(), NOW())
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
      SELECT * FROM "ActivityEvidence" 
      WHERE "studentId" = ${studentIdInt} 
      ORDER BY "createdAt" DESC
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
      UPDATE "ActivityEvidence" 
      SET status = ${status}, 
          "adminTitle" = ${adminTitle || null}, 
          points = ${points ? parseInt(String(points)) : null}, 
          "sectionId" = ${sectionId || null}, 
          "criterionId" = ${criterionId || null},
          "semesterId" = ${semesterId || null},
          "updatedAt" = NOW()
      WHERE id = ${parseInt(String(id))}
    `;

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
      SELECT id FROM "ActivityEvidence" 
      WHERE id = ${evidenceId} AND "studentId" = ${studentIdInt}
      LIMIT 1
    `;

    if (evidence.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy minh chứng hoặc bạn không có quyền xóa' });
    }

    await prisma.$executeRaw`
      DELETE FROM "ActivityEvidence" WHERE id = ${evidenceId}
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
