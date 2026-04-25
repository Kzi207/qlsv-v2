import type { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

export const getMyTuition = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.studentId;
  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const tuition = await prisma.tuition.findMany({
      where: { studentId: Number(studentId) },
      include: { 
        student: {
          include: {
            class: {
              include: { major: true }
            }
          }
        }
      },
      orderBy: { semesterId: 'desc' }
    });
    res.json(tuition);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllTuition = async (req: AuthRequest, res: Response) => {
  try {
    const tuition = await prisma.tuition.findMany({
      include: { student: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tuition);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const payTuition = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body; // Mock payment amount

  try {
    const tuition = await prisma.tuition.findUnique({ where: { id: Number(id) } });
    if (!tuition) return res.status(404).json({ error: 'Not found' });

    const newPaidAmount = tuition.paidAmount + Number(amount);
    const newRemainingAmount = Math.max(0, tuition.totalAmount - newPaidAmount);
    let status = 'PARTIAL_PAID';
    if (newRemainingAmount === 0) status = 'PAID';

    const updated = await prisma.tuition.update({
      where: { id: Number(id) },
      data: { 
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const generateTuition = async (req: AuthRequest, res: Response) => {
  const { semesterId, classId, curriculumSemesterNumber } = req.body;
  if (!semesterId) return res.status(400).json({ error: 'System Semester is required' });

  try {
    // 1. Get students
    const where: any = {};
    if (classId) where.class_id = classId;
    const students = await prisma.student.findMany({ 
      where,
      include: { class: { include: { major: true } } }
    });

    let count = 0;

    for (const student of students) {
      const subjectMap = new Map();

      // OPTION A: If curriculumSemesterNumber is provided, pull from Curriculum
      if (curriculumSemesterNumber && student.class?.majorId) {
        const curriculumSem = await prisma.curriculumSemester.findFirst({
          where: { 
            majorId: student.class.majorId, 
            semesterNumber: Number(curriculumSemesterNumber) 
          },
          include: { subjects: { include: { subject: true } } }
        });
        
        if (curriculumSem) {
          curriculumSem.subjects.forEach(cs => {
            if (cs.subject) subjectMap.set(cs.subjectId, cs.subject);
          });
        }
      }

      // OPTION B: Also include any manually assigned ClassSubjects for this specific system semester
      const classSubjects = await prisma.classSubject.findMany({
        where: { classId: student.class_id, semesterId },
        include: { subject: true }
      });
      classSubjects.forEach(cs => subjectMap.set(cs.subjectId, cs.subject));

      // OPTION C: Include individual registrations
      const registrations = await prisma.courseRegistration.findMany({
        where: { studentId: student.id, semesterId },
        include: { subject: true }
      });
      registrations.forEach(r => subjectMap.set(r.subjectId, r.subject));

      const totalAmount = Array.from(subjectMap.values()).reduce(
        (sum, sub) => sum + (sub.credits * sub.pricePerCredit), 
        0
      );

      // 5. Upsert tuition record
      const existingTuition = await prisma.tuition.findUnique({
        where: { studentId_semesterId: { studentId: student.id, semesterId } }
      });

      const paidAmount = existingTuition?.paidAmount || 0;
      const remainingAmount = Math.max(0, totalAmount - paidAmount);
      const status = totalAmount === 0 ? 'PAID' : (remainingAmount === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL_PAID' : 'UNPAID'));

      await prisma.tuition.upsert({
        where: { studentId_semesterId: { studentId: student.id, semesterId } },
        update: { 
          totalAmount,
          remainingAmount,
          status
        },
        create: { 
          studentId: student.id, 
          semesterId, 
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          status: totalAmount === 0 ? 'PAID' : 'UNPAID'
        }
      });
      count++;
    }

    res.json({ message: `Đã khởi tạo học phí cho ${count} sinh viên. Nguồn dữ liệu: ${curriculumSemesterNumber ? 'Chương trình khung (HK' + curriculumSemesterNumber + ') & ' : ''}Đăng ký lẻ.` });
  } catch (error: any) {
    console.error('Lỗi khởi tạo học phí:', error);
    res.status(500).json({ error: error.message });
  }
};
