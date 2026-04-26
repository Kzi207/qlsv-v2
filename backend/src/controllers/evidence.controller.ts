import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/logger';

export const saveDraft = async (req: Request, res: Response) => {
  try {
    const { semesterId, manualData } = req.body;
    const user = (req as any).user;

    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });

    const slip = await prisma.trainingEvidenceSlip.upsert({
      where: {
        studentId_semesterId: {
          studentId: user.studentId,
          semesterId: String(semesterId)
        }
      },
      update: {
        manualData,
        status: 'DRAFT'
      },
      create: {
        studentId: user.studentId,
        semesterId,
        manualData,
        status: 'DRAFT'
      }
    });

    await logAudit({
      userId: Number(user.id),
      action: 'SAVE_EVIDENCE_DRAFT',
      targetType: 'EvidenceSlip',
      targetId: String(slip.id),
      details: { semesterId },
      req
    });

    res.json(slip);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitSlip = async (req: Request, res: Response) => {
  try {
    const { semesterId, manualData } = req.body;
    const user = (req as any).user;

    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });

    const slip = await prisma.trainingEvidenceSlip.upsert({
      where: {
        studentId_semesterId: {
          studentId: user.studentId,
          semesterId
        }
      },
      update: {
        manualData,
        status: 'SUBMITTED',
        updatedAt: new Date()
      },
      create: {
        studentId: user.studentId,
        semesterId,
        manualData,
        status: 'SUBMITTED'
      }
    });

    await logAudit({
      userId: Number(user.id),
      action: 'SUBMIT_EVIDENCE',
      targetType: 'EvidenceSlip',
      targetId: String(slip.id),
      details: { semesterId },
      req
    });

    res.json({ message: 'Nộp phiếu thành công', slip });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMySlip = async (req: Request, res: Response) => {
  try {
    const { semesterId } = req.params;
    const user = (req as any).user;

    if (!user || !user.studentId) return res.status(403).json({ error: 'Forbidden' });

    const slip = await prisma.trainingEvidenceSlip.findUnique({
      where: {
        studentId_semesterId: {
          studentId: user.studentId,
          semesterId: String(semesterId)
        }
      }
    });

    // Also get scanned records to show separately
    const scannedRecords = await prisma.activityAttendanceRecord.findMany({
      where: { studentId: user.studentId },
      include: { session: true }
    });

    res.json({ slip, scannedRecords });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllSlips = async (req: Request, res: Response) => {
  try {
    const { semesterId } = req.query;
    const slips = await prisma.trainingEvidenceSlip.findMany({
      where: semesterId ? { semesterId: String(semesterId) } : {},
      include: { 
        student: {
          include: { class: true }
        }
      }
    });
    res.json(slips);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reviewSlip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED
    const slip = await prisma.trainingEvidenceSlip.update({
      where: { id: parseInt(String(id), 10) },
      data: { status }
    });

    await logAudit({
      userId: Number((req as any).user?.id),
      action: 'REVIEW_EVIDENCE',
      targetType: 'EvidenceSlip',
      targetId: String(id),
      details: { status },
      req
    });

    res.json(slip);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
