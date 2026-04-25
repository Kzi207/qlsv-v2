import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import * as mammoth from 'mammoth';

// --- COURSE MANAGEMENT ---

export const getCourses = async (req: AuthRequest, res: Response) => {
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);
  
  if (isNaN(userId) && role !== 'STUDENT') {
     console.error('Invalid user ID in token');
     return res.status(401).json({ message: 'Invalid authentication state' });
  }

  try {
    console.log(`Fetching courses for role: ${role}, userId: ${userId}`);

    if (role === 'STUDENT') {
      const studentId = req.user?.studentId;
      if (!studentId) {
        console.warn('Student role but no studentId found in token');
        return res.json([]);
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          registrations: {
            where: { status: 'APPROVED' },
            include: {
              subject: {
                include: {
                  courses: {
                    where: { isActive: true },
                    include: {
                      subject: true,
                      teacher: true,
                      lessons: { where: { isVisible: true } },
                      assignments: {
                        include: {
                          submissions: {
                            where: { studentId: Number(studentId) }
                          }
                        }
                      },
                      exams: {
                        include: {
                          results: {
                            where: { studentId: Number(studentId) }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!student) return res.json([]);

      // Flatten courses from approved registrations
      const courses = student.registrations?.flatMap((reg: any) => reg.subject.courses) || [];
      return res.json(courses);
    } 
    
    if (role === 'LECTURER' || role === 'QTV') {
      const courses = await prisma.course.findMany({
        where: role === 'LECTURER' ? { teacherId: userId } : {},
        include: {
          subject: {
            include: {
              _count: {
                select: { registrations: true }
              }
            }
          },
          teacher: true,
          lessons: true,
          assignments: {
            include: {
              submissions: {
                include: {
                  student: true
                },
                orderBy: { submittedAt: 'desc' }
              }
            }
          },
          exams: true,
          _count: {
            select: { lessons: true, assignments: true, exams: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      return res.json(courses);
    }

    return res.status(403).json({ message: 'Forbidden' });
  } catch (error: any) {
    console.error('getCourses error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalSubjects, totalCourses, totalTeachers, totalStudents] = await Promise.all([
      prisma.subject.count(),
      prisma.course.count(),
      prisma.user.count({ where: { role: 'LECTURER' } }),
      prisma.student.count(),
    ]);

    res.json({
      totalSubjects,
      totalCourses,
      totalTeachers,
      totalStudents
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeacherStats = async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id);
  try {
    const [totalCourses, totalStudents, totalLessons, pendingAssignments] = await Promise.all([
      prisma.course.count({ where: { teacherId: userId } }),
      prisma.courseRegistration.count({ 
        where: { 
          subject: {
            courses: {
              some: { teacherId: userId }
            }
          }
        } 
      }),
      prisma.lesson.count({
        where: { course: { teacherId: userId } }
      }),
      prisma.assignmentSubmission.count({
        where: { 
          assignment: { course: { teacherId: userId } },
          grade: null
        }
      })
    ]);

    res.json({
      totalCourses,
      totalStudents,
      totalLessons,
      pendingAssignments
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseDetail = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const courseId = Number(id);

  if (isNaN(courseId)) {
    return res.status(400).json({ message: 'Invalid course ID' });
  }

  try {
    const role = req.user?.role?.toUpperCase();
    const studentId = req.user?.studentId ? Number(req.user.studentId) : null;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        subject: true,
        teacher: true,
        lessons: { 
          where: role === 'STUDENT' ? { isVisible: true } : undefined,
          orderBy: { order: 'asc' } 
        },
        assignments: {
          include: {
            submissions: {
              where: role === 'STUDENT' && studentId ? { studentId: studentId } : undefined,
              include: { student: true }
            }
          }
        },
        exams: {
          include: {
            results: {
              where: role === 'STUDENT' && studentId ? { studentId: studentId } : undefined
            }
          }
        }
      }
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const registration = studentId ? await prisma.courseRegistration.findFirst({
      where: {
        studentId: studentId,
        subjectId: course.subjectId,
        semesterId: course.semesterId,
        status: 'APPROVED'
      }
    }) : null;
    
    const responseData = { 
      ...course, 
      isRegistered: !!registration,
      hasEnrollKey: !!course.enrollKey
    };

    // Hide the key from students
    if (role === 'STUDENT' && !registration) {
      delete (responseData as any).enrollKey;
    }

    res.json(responseData);
  } catch (error: any) {
    console.error('getCourseDetail error:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
};

// --- ASSIGNMENTS ---

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  const { assignmentId, content } = req.body;
  const studentId = req.user?.studentId;
  const file = req.file;

  if (!studentId) return res.status(403).json({ message: 'Only students can submit' });

  try {
    let fileUrl = req.body.fileUrl;
    if (file) {
      fileUrl = `/uploads/media/${file.filename}`;
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: Number(assignmentId),
          studentId: Number(studentId)
        }
      },
      update: { 
        fileUrl: fileUrl || '', 
        content: content || '', 
        submittedAt: new Date() 
      },
      create: {
        assignmentId: Number(assignmentId),
        studentId: Number(studentId),
        fileUrl: fileUrl || '',
        content: content || ''
      }
    });
    res.json(submission);
  } catch (error: any) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// --- EXAMS ---

// --- COURSE CREATION ---

export const createCourse = async (req: AuthRequest, res: Response) => {
  const { subjectId, name, description, image, semesterId, classId, teacherId, enrollKey } = req.body;
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  try {
    // If lecturer, force teacherId to themselves
    const finalTeacherId = role === 'LECTURER' ? userId : (teacherId || userId);

    const course = await prisma.course.create({
      data: {
        subjectId: Number(subjectId),
        teacherId: Number(finalTeacherId),
        semesterId: semesterId || '2023-2024.2',
        classId: classId || null,
        name,
        description,
        image,
        enrollKey: enrollKey || null,
        isActive: true
      } as any,
      include: {
        subject: true,
        teacher: true
      }
    });
    res.status(201).json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, image, enrollKey, isActive } = req.body;
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  try {
    const course = await prisma.course.findUnique({ where: { id: Number(id) } });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    if (role === 'LECTURER' && course.teacherId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await (prisma.course as any).update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        image,
        enrollKey,
        isActive
      }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'LECTURER' },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' }
    });
    res.json(teachers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- LESSON MANAGEMENT ---

export const getLessons = async (req: AuthRequest, res: Response) => {
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  try {
    const lessons = await prisma.lesson.findMany({
      where: role === 'LECTURER' ? { course: { teacherId: userId } } : {},
      include: {
        course: {
          include: {
            subject: true,
            teacher: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(lessons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLessonVisibility = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isVisible } = req.body;
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  try {
    // Check ownership if lecturer
    if (role === 'LECTURER') {
      const lesson = await prisma.lesson.findUnique({
        where: { id: Number(id) },
        include: { course: true }
      });
      if (!lesson || lesson.course.teacherId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const updated = await prisma.lesson.update({
      where: { id: Number(id) },
      data: { isVisible }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLesson = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const lessonId = Number(id);
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  if (isNaN(lessonId)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    // Check ownership if lecturer
    if (role === 'LECTURER') {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { course: true }
      });
      if (!lesson || lesson.course.teacherId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    await prisma.lesson.delete({
      where: { id: lessonId }
    });
    res.json({ message: 'Lesson deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLesson = async (req: AuthRequest, res: Response) => {
  const { courseId, title, content, order } = req.body;
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);
  const file = req.file;

  try {
    if (role === 'LECTURER') {
      const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
      if (!course || course.teacherId !== userId) return res.status(403).json({ message: 'Forbidden' });
    }

    let fileUrl = req.body.fileUrl;
    let fileType = req.body.fileType || 'video';

    if (file) {
      fileUrl = `/uploads/media/${file.filename}`;
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') fileType = 'pdf';
      else if (['ppt', 'pptx', 'slide'].includes(ext || '')) fileType = 'slide';
      else fileType = 'video';
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId: Number(courseId),
        title,
        content: content || '',
        fileUrl: fileUrl || '',
        fileType,
        duration: req.body.duration || '',
        order: Number(order || 0)
      }
    });
    res.status(201).json(lesson);
  } catch (error: any) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  const { courseId, title, description, fileUrl, dueDate, maxPoints, allowLate } = req.body;
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  try {
    if (role === 'LECTURER') {
      const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
      if (!course || course.teacherId !== userId) return res.status(403).json({ message: 'Forbidden' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId: Number(courseId),
        title,
        description,
        fileUrl,
        dueDate: new Date(dueDate),
        maxPoints: Number(maxPoints || 10),
        allowLate: !!allowLate
      }
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createExam = async (req: AuthRequest, res: Response) => {
  const { courseId, title, description, startTime, duration, maxPoints, shuffle, questions } = req.body;
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  try {
    if (role === 'LECTURER') {
      const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
      if (!course || course.teacherId !== userId) return res.status(403).json({ message: 'Forbidden' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + (Number(duration) || 60) * 60000);

    const exam = await prisma.exam.create({
      data: {
        courseId: Number(courseId),
        title,
        description,
        startTime: start,
        endTime: end,
        duration: Number(duration),
        maxPoints: Number(maxPoints || 10),
        shuffle: !!shuffle,
        status: 'PUBLISHED',
        questions: {
          create: questions?.map((q: any, idx: number) => ({
            question: q.question,
            type: q.type || 'MULTIPLE_CHOICE',
            points: Number(q.points || 1),
            order: idx,
            options: {
              create: q.options.map((opt: any) => ({
                content: opt.content,
                isCorrect: !!opt.isCorrect
              }))
            }
          }))
        }
      },
      include: {
        questions: {
          include: { options: true }
        }
      }
    });
    res.status(201).json(exam);
  } catch (error: any) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;
  const role = req.user?.role?.toUpperCase();

  if (role !== 'LECTURER' && role !== 'QTV') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const submission = await prisma.assignmentSubmission.update({
      where: { id: Number(id) },
      data: {
        grade: parseFloat(grade),
        feedback: feedback
      }
    });
    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const assignmentId = Number(id);
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  if (isNaN(assignmentId)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    if (role === 'LECTURER') {
      const item = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: { course: true } });
      if (!item || item.course.teacherId !== userId) return res.status(403).json({ message: 'Forbidden' });
    }
    await prisma.assignment.delete({ where: { id: assignmentId } });
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getExamDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const examId = Number(id);

  if (isNaN(examId)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitExam = async (req: AuthRequest, res: Response) => {
  const { examId, answers } = req.body; // answers is an object { questionId: selectedOptionId }
  const studentId = Number(req.user?.studentId);

  if (!studentId) return res.status(403).json({ message: 'Only students can take exams' });

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: Number(examId) },
      include: {
        questions: {
          include: { options: true }
        }
      }
    });

    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    let totalPoints = 0;
    const questions = exam.questions;

    questions.forEach(q => {
      const selectedOptionId = answers[q.id];
      const correctOption = q.options.find(opt => opt.isCorrect);
      if (selectedOptionId && correctOption && Number(selectedOptionId) === correctOption.id) {
        totalPoints += q.points;
      }
    });

    const score = (totalPoints / questions.reduce((sum, q) => sum + q.points, 0)) * exam.maxPoints;

    const result = await prisma.examResult.upsert({
      where: {
        examId_studentId: {
          examId: Number(examId),
          studentId: studentId
        }
      },
      update: {
        score: score,
        status: 'SUBMITTED',
        answers: answers,
        finishedAt: new Date()
      },
      create: {
        examId: Number(examId),
        studentId: studentId,
        score: score,
        status: 'SUBMITTED',
        answers: answers,
        finishedAt: new Date()
      }
    });

    res.json(result);
  } catch (error: any) {
    console.error('Submit exam error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteExam = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const examId = Number(id);
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  if (isNaN(examId)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    if (role === 'LECTURER') {
      const item = await prisma.exam.findUnique({ where: { id: examId }, include: { course: true } });
      if (!item || item.course.teacherId !== userId) return res.status(403).json({ message: 'Forbidden' });
    }
    await prisma.exam.delete({ where: { id: examId } });
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseRegistrations = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const courseId = Number(id);

  if (isNaN(courseId)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const registrations = await prisma.courseRegistration.findMany({
      where: { 
        subjectId: course.subjectId,
        semesterId: course.semesterId
      },
      include: {
        student: true
      }
    });
    res.json(registrations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const enrollStudent = async (req: AuthRequest, res: Response) => {
  const { courseId } = req.body;
  const studentId = req.body.studentId || req.user?.studentId;
  
  if (!studentId) return res.status(400).json({ message: 'Student ID is required' });
  try {
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) }
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check if already enrolled
    const { password } = req.body;
    if (course.enrollKey && course.enrollKey !== password) {
      return res.status(403).json({ message: 'Mật khẩu ghi danh không chính xác' });
    }

    const existing = await prisma.courseRegistration.findUnique({
      where: {
        studentId_subjectId_semesterId: {
          studentId: Number(studentId),
          subjectId: course.subjectId,
          semesterId: course.semesterId
        }
      }
    });

    if (existing) return res.status(400).json({ error: 'Sinh viên đã đăng ký môn học này' });

    const registration = await prisma.courseRegistration.create({
      data: {
        studentId: Number(studentId),
        subjectId: course.subjectId,
        semesterId: course.semesterId,
        status: 'APPROVED'
      }
    });
    res.status(201).json(registration);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRegistration = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const regId = Number(id);
  if (isNaN(regId)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    await prisma.courseRegistration.delete({
      where: { id: regId }
    });
    res.json({ message: 'Registration removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const importExamQuestionsWord = async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const result = await mammoth.extractRawText({ path: file.path });
    const text = result.value;
    
    const questions: any[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let currentQuestion: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      // Match "1. Question" or "Câu 1: Question"
      const questionMatch = line.match(/^(\d+|Câu \d+)[:.]\s*(.*)/i);
      if (questionMatch) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: questionMatch[2],
          type: 'MULTIPLE_CHOICE',
          options: []
        };
        continue;
      }

      // Match options "A. Content" or "A) Content"
      const optionMatch = line.match(/^([A-D])[:.)]\s*(.*)/i);
      if (optionMatch && currentQuestion) {
        currentQuestion.options.push({
          content: optionMatch[2],
          isCorrect: false
        });
        continue;
      }

      // Match correct answer "Answer: A" or "Đáp án: A"
      const answerMatch = line.match(/^(Answer|Đáp án)[:.]\s*([A-D])/i);
      if (answerMatch && currentQuestion && answerMatch[2]) {
        const correctLetter = answerMatch[2].toUpperCase();
        const letterIndex = correctLetter.charCodeAt(0) - 65;
        if (currentQuestion.options[letterIndex]) {
          currentQuestion.options[letterIndex].isCorrect = true;
        }
        continue;
      }
    }
    
    if (currentQuestion) questions.push(currentQuestion);

    res.json(questions);
  } catch (error: any) {
    console.error('Word import error:', error);
    res.status(500).json({ error: 'Không thể xử lý tệp Word' });
  }
};
