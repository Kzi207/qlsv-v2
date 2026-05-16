import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';
import { logAudit } from '../utils/logger';

export const getGradesByClass = async (req: AuthRequest, res: Response) => {
  const { classId, subject, semesterId } = req.query;

  if (!classId || !subject || !semesterId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Handle merged classes (e.g., "Class A + Class B")
    const classIds = String(classId).split('+').map(c => c.trim());

    // Get all students in these classes
    const students = await prisma.student.findMany({
      where: { 
        class_id: {
          in: classIds
        }
      },
      orderBy: { order_number: 'asc' },
      include: {
        grade: {
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
      grade: s.grade[0] || null
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
    const teacherId = req.user?.id ? Number(req.user.id) : null;
    const teacherIdValue = teacherId && !isNaN(teacherId) ? teacherId : null;

    // Use transaction for bulk operations to ensure consistency and better performance
    await prisma.$transaction(
      grades.map((g: any) => {
        const mScore = g.midtermScore !== undefined ? Number(g.midtermScore) : 0;
        const fScore = g.finalScore !== undefined ? Number(g.finalScore) : 0;
        const studentId = Number(g.studentId);
        
        const totalScore = calculateTotal(0, mScore, fScore) || 0;
        
        return (prisma as any).grade.upsert({
          where: {
            studentId_subject_semesterId: {
              studentId: studentId,
              subject: String(subject),
              semesterId: String(semesterId)
            }
          },
          update: {
            midtermScore: mScore,
            finalScore: fScore,
            totalScore: totalScore,
            teacherId: teacherIdValue,
            updatedAt: new Date()
          },
          create: {
            studentId: studentId,
            subject: String(subject),
            semesterId: String(semesterId),
            processScore: 0,
            midtermScore: mScore,
            finalScore: fScore,
            totalScore: totalScore,
            teacherId: teacherIdValue,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      })
    );

    if (teacherIdValue) {
      await logAudit({
        userId: teacherIdValue,
        action: 'UPDATE_GRADES',
        targetType: 'Grade',
        details: { subject, semesterId, count: grades.length },
        req
      });
    }

    res.json({ message: 'Cập nhật điểm thành công' });
  } catch (error) {
    console.error('CRITICAL: Bulk upsert error:', error);
    res.status(500).json({ 
      error: 'Lỗi hệ thống khi lưu điểm số lượng lớn',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getMyGrades = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.studentId;
  if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // 1. Get student info including class and major
    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) },
      include: {
        class: {
          include: {
            major: true
          }
        }
      }
    });

    if (!student || !student.Renamedclass?.majorId) {
      return res.status(404).json({ error: 'Student or Major not found' });
    }

    const majorId = student.Renamedclass.majorId;

    // 2. Get all curriculum subjects for this major
    const curriculumSubjects = await prisma.curriculumsubject.findMany({
      where: { majorId: majorId },
      include: {
        subject_curriculumsubject_subjectIdTosubject: true,
        curriculumsemester: true
      }
    });

    // 3. Get all existing grades for this student
    const grades = await prisma.grade.findMany({
      where: { studentId: Number(studentId) }
    });

    // 4. Map existing grades by subject name
    const gradeMap = new Map();
    grades.forEach(g => {
      gradeMap.set(g.subject, g);
    });

    // 5. Merge curriculum with grades
    const result = curriculumSubjects.map(cs => {
      const subject = cs.subject_curriculumsubject_subjectIdTosubject;
      const grade = gradeMap.get(subject.name);
      
      const midtermScore = grade?.midtermScore ?? null;
      const finalScore = grade?.finalScore ?? null;
      
      // Calculate total if both scores exist
      let totalScore = null;
      let gradePoint = null;
      let letterGrade = null;

      if (midtermScore !== null && finalScore !== null) {
        totalScore = (midtermScore * 0.4) + (finalScore * 0.6);
        totalScore = Math.round(totalScore * 100) / 100;
        
        // Convert to 4.0 scale and letter grade based on user's requirements
        if (totalScore >= 9.5) { gradePoint = 4.0; letterGrade = 'A+'; }
        else if (totalScore >= 8.5) { gradePoint = 3.8; letterGrade = 'A'; }
        else if (totalScore >= 8.0) { gradePoint = 3.5; letterGrade = 'B+'; }
        else if (totalScore >= 7.0) { gradePoint = 3.0; letterGrade = 'B'; }
        else if (totalScore >= 6.5) { gradePoint = 2.5; letterGrade = 'C+'; }
        else if (totalScore >= 5.5) { gradePoint = 2.0; letterGrade = 'C'; }
        else if (totalScore >= 5.0) { gradePoint = 1.5; letterGrade = 'D+'; }
        else if (totalScore >= 4.0) { gradePoint = 1.0; letterGrade = 'D'; }
        else { gradePoint = 0.0; letterGrade = 'F'; }
      }

      return {
        id: grade?.id || null,
        subject: subject.name,
        subjectCode: subject.code,
        credits: subject.credits,
        semesterNumber: cs.curriculumsemester.semesterNumber,
        semesterName: cs.curriculumsemester.name,
        midtermScore,
        finalScore,
        totalScore,
        gradePoint,
        letterGrade,
        isGraded: !!grade
      };
    }).sort((a, b) => a.semesterNumber - b.semesterNumber);

    res.json(result);
  } catch (error) {
    console.error('Get my grades error:', error);
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
          { teacher: { contains: String(teacherName || '') } },
          { teacher: { contains: String(username || '') } }
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
  if (midterm === undefined || final === undefined) return null;
  // New formula: 40% Midterm + 60% Final
  const total = (Number(midterm) * 0.4) + (Number(final) * 0.6);
  return Math.round(total * 100) / 100;
};
