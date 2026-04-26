import type { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';
import { logAudit } from '../utils/logger';

// --- SUBJECTS ---
export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({ orderBy: { code: 'asc' } });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createSubject = async (req: AuthRequest, res: Response) => {
  const { code, name, credits, pricePerCredit, theoryPeriods, practicePeriods, subjectType } = req.body;
  try {
    const subject = await prisma.subject.create({
      data: { 
        code, 
        name, 
        credits: Number(credits), 
        pricePerCredit: Number(pricePerCredit || 500000),
        theoryPeriods: Number(theoryPeriods || 0),
        practicePeriods: Number(practicePeriods || 0),
        subjectType: subjectType || 'LECTURE'
      }
    });
    await logAudit({
      userId: Number(req.user?.id),
      action: 'CREATE_SUBJECT',
      targetType: 'Subject',
      targetId: String(subject.id),
      details: { code, name },
      req
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { code, name, credits, pricePerCredit, theoryPeriods, practicePeriods, subjectType } = req.body;
  try {
    const subject = await prisma.subject.update({
      where: { id: Number(id) },
      data: { 
        code, 
        name, 
        credits: Number(credits), 
        pricePerCredit: Number(pricePerCredit),
        theoryPeriods: Number(theoryPeriods),
        practicePeriods: Number(practicePeriods),
        subjectType
      }
    });

    await logAudit({
      userId: Number(req.user?.id),
      action: 'UPDATE_SUBJECT',
      targetType: 'Subject',
      targetId: String(id),
      details: { code, name },
      req
    });

    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const bulkUpdateSubjectPrice = async (req: AuthRequest, res: Response) => {
  const { pricePerCredit } = req.body;
  try {
    await prisma.subject.updateMany({
      data: { pricePerCredit: Number(pricePerCredit) }
    });
    res.json({ message: 'Updated all subjects' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const subject = await prisma.subject.findUnique({ where: { id: Number(id) } });
    await prisma.subject.delete({ where: { id: Number(id) } });

    await logAudit({
      userId: Number(req.user?.id),
      action: 'DELETE_SUBJECT',
      targetType: 'Subject',
      targetId: String(id),
      details: { code: subject?.code, name: subject?.name },
      req
    });

    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// --- REGISTRATIONS ---
export const getMyRegistrations = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.studentId;
  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const regs = await prisma.courseRegistration.findMany({
      where: { studentId: Number(studentId) },
      include: { subject: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(regs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const registerSubject = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.studentId;
  const { subjectId, semesterId } = req.body;

  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Check if already registered
    const existing = await prisma.courseRegistration.findUnique({
      where: {
        studentId_subjectId_semesterId: {
          studentId: Number(studentId),
          subjectId: Number(subjectId),
          semesterId: String(semesterId)
        }
      }
    });

    if (existing) return res.status(400).json({ error: 'Đã đăng ký học phần này' });

    const reg = await prisma.courseRegistration.create({
      data: {
        studentId: Number(studentId),
        subjectId: Number(subjectId),
        semesterId: String(semesterId)
      }
    });

    // Update tuition automatically
    await updateTuition(Number(studentId), String(semesterId));

    res.status(201).json(reg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const cancelRegistration = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const studentId = req.user?.studentId;

  try {
    const reg = await prisma.courseRegistration.findUnique({ where: { id: Number(id) } });
    if (!reg) return res.status(404).json({ error: 'Not found' });
    if (req.user?.role !== 'QTV' && reg.studentId !== studentId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.courseRegistration.delete({ where: { id: Number(id) } });
    
    // Update tuition automatically
    await updateTuition(reg.studentId, reg.semesterId);

    res.json({ message: 'Cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper to update tuition based on registrations
export const assignSubjectToClass = async (req: AuthRequest, res: Response) => {
  const { classId, subjectId, semesterId } = req.body;
  try {
    const cs = await prisma.classSubject.create({
      data: { classId, subjectId: Number(subjectId), semesterId }
    });
    res.status(201).json(cs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const unassignSubjectFromClass = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.classSubject.delete({ where: { id: Number(id) } });
    res.json({ message: 'Unassigned' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSubjectsByClass = async (req: AuthRequest, res: Response) => {
  const { classId, semesterId } = req.query;
  try {
    const assignments = await prisma.classSubject.findMany({
      where: { 
        classId: classId ? String(classId) : undefined,
        semesterId: semesterId ? String(semesterId) : undefined
      },
      include: { subject: true }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTuition = async (studentId: number, semesterId: string) => {
  const regs = await prisma.courseRegistration.findMany({
    where: { studentId, semesterId },
    include: { subject: true }
  });

  const totalAmount = regs.reduce((sum, reg) => sum + (reg.subject.credits * reg.subject.pricePerCredit), 0);

  await prisma.tuition.upsert({
    where: { studentId_semesterId: { studentId, semesterId } },
    update: { totalAmount },
    create: { studentId, semesterId, totalAmount }
  });
};
