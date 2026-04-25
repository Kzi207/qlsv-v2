import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const createSession = async (req: Request, res: Response) => {
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

    res.json(sessions[0]);
  } catch (error: any) {
    console.error('Error in createSession:', error);
    res.status(500).json({ error: error.message });
  }
};

export const scanQR = async (req: Request, res: Response) => {
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

    res.json({ message: 'Điểm danh thành công' });
  } catch (error: any) {
    console.error('Error in scanQR:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getMyRecords = async (req: Request, res: Response) => {
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

export const getSessionStats = async (req: Request, res: Response) => {
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

export const updateRecord = async (req: Request, res: Response) => {
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

export const deleteRecord = async (req: Request, res: Response) => {
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

export const deleteSession = async (req: Request, res: Response) => {
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

export const toggleSessionStatus = async (req: Request, res: Response) => {
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

export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.$queryRaw`
      SELECT * FROM "ActivityAttendanceSession" ORDER BY "createdAt" DESC
    `;
    res.json(sessions);
  } catch (error: any) {
    console.error('Error in getAllSessions:', error);
    res.status(500).json({ error: error.message });
  }
};

// --- MANUAL EVIDENCE METHODS ---

export const uploadEvidence = async (req: Request, res: Response) => {
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

    res.json({ message: 'Tải minh chứng thành công, vui lòng chờ duyệt' });
  } catch (error: any) {
    console.error('Error in uploadEvidence:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getMyEvidenceRequests = async (req: Request, res: Response) => {
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

export const getAllPendingEvidence = async (req: Request, res: Response) => {
  try {
    const evidence = await prisma.$queryRaw`
      SELECT e.*, row_to_json(s) as student
      FROM "ActivityEvidence" e
      JOIN "Student" s ON e."studentId" = s.id
      WHERE e.status = 'PENDING'
      ORDER BY e."createdAt" ASC
    `;
    res.json(evidence);
  } catch (error: any) {
    console.error('Error in getAllPendingEvidence:', error);
    res.status(500).json({ error: error.message });
  }
};

export const reviewEvidence = async (req: Request, res: Response) => {
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

    res.json({ message: 'Đã cập nhật trạng thái minh chứng' });
  } catch (error: any) {
    console.error('Error in reviewEvidence:', error);
    res.status(500).json({ error: error.message });
  }
};
