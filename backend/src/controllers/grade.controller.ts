import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

export const getGradesByClass = async (req: AuthRequest, res: Response) => {
  const { classId, subject, semesterId } = req.query;

  if (!classId || !subject || !semesterId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { class_id: String(classId) },
      orderBy: { order_number: 'asc' },
      include: {
        grades: {
          where: {
            subject: String(subject),
            semesterId: String(semesterId)
          }
        }
      }
    });

    const result = students.map(s => ({
      id: s.id,
      student_code: s.student_code,
      name: s.name,
      grade: s.grades[0] || null
    }));

    res.json(result);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const upsertGrades = async (req: AuthRequest, res: Response) => {
  const { subject, semesterId, grades } = req.body;
  const teacherId = req.user?.id;

  if (!subject || !semesterId || !Array.isArray(grades)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  try {
    const operations = grades.map((g: any) => {
      const totalScore = calculateTotal(g.processScore, g.midtermScore, g.finalScore);
      
      return prisma.grade.upsert({
        where: {
          studentId_subject_semesterId: {
            studentId: Number(g.studentId),
            subject: String(subject),
            semesterId: String(semesterId)
          }
        },
        update: {
          processScore: g.processScore !== undefined ? Number(g.processScore) : undefined,
          midtermScore: g.midtermScore !== undefined ? Number(g.midtermScore) : undefined,
          finalScore: g.finalScore !== undefined ? Number(g.finalScore) : undefined,
          totalScore,
          teacherId: Number(teacherId)
        },
        create: {
          studentId: Number(g.studentId),
          subject: String(subject),
          semesterId: String(semesterId),
          processScore: Number(g.processScore || 0),
          midtermScore: Number(g.midtermScore || 0),
          finalScore: Number(g.finalScore || 0),
          totalScore,
          teacherId: Number(teacherId)
        }
      });
    });

    await Promise.all(operations);
    res.json({ message: 'Cập nhật điểm thành công' });
  } catch (error) {
    console.error('Upsert grades error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMyGrades = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.studentId;
  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const grades = await prisma.grade.findMany({
      where: { studentId: Number(studentId) },
      orderBy: { semesterId: 'desc' }
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMyTeachingAssignments = async (req: AuthRequest, res: Response) => {
  const teacherName = req.user?.name;
  const username = req.user?.username;

  if (!teacherName && !username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find all timetable entries for this teacher
    const assignments = await prisma.timetable.findMany({
      where: {
        OR: [
          { teacher: { contains: String(teacherName), mode: 'insensitive' } },
          { teacher: { contains: String(username), mode: 'insensitive' } }
        ]
      },
      select: {
        classId: true,
        subject: true,
        semesterId: true
      },
      distinct: ['classId', 'subject', 'semesterId']
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const calculateTotal = (process?: number, midterm?: number, final?: number) => {
  if (process === undefined || midterm === undefined || final === undefined) return null;
  // Common formula: 20% Process + 30% Midterm + 50% Final
  const total = (Number(process) * 0.2) + (Number(midterm) * 0.3) + (Number(final) * 0.5);
  return Math.round(total * 100) / 100;
};
