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

      const student = await (prisma as any).student.findUnique({
        where: { id: studentId },
        include: {
          courseregistration: {
            where: { status: 'APPROVED' },
            include: {
              subject: {
                include: {
                  course: {
                    where: { isActive: true },
                    include: {
                      subject: true,
                      user: true,
                      lesson: { where: { isVisible: true } },
                      assignment: {
                        include: {
                          assignmentsubmission: {
                            where: { studentId: Number(studentId) }
                          }
                        }
                      },
                      exam: {
                        include: {
                          examresult: {
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
      const courses = (student as any).courseregistration?.flatMap((reg: any) => 
        reg.subject.course.map((c: any) => ({
          ...c,
          teacher: c.user,
          lessons: c.lesson,
          assignments: c.assignment?.map((a: any) => ({
            ...a,
            submissions: a.assignmentsubmission
          })),
          exams: c.exam?.map((e: any) => ({
            ...e,
            results: e.examresult
          }))
        }))
      ) || [];
      
      return res.json(courses);
    } 
    
    if (role === 'LECTURER' || role === 'QTV') {
      const courses = await (prisma as any).course.findMany({
        where: role === 'LECTURER' ? { teacherId: userId } : {},
        include: {
          subject: {
            include: {
              _count: {
                select: { courseregistration: true }
              }
            }
          },
          user: true,
          lesson: true,
          assignment: {
            include: {
              assignmentsubmission: {
                include: {
                  student: true
                },
                orderBy: { submittedAt: 'desc' }
              }
            }
          },
          exam: true,
          _count: {
            select: { lesson: true, assignment: true, exam: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      // Map for frontend compatibility
      const mapped = courses.map((c: any) => ({
        ...c,
        teacher: c.user, // Map user to teacher
        lessons: c.lesson,
        assignments: c.assignment?.map((a: any) => ({
          ...a,
          submissions: a.assignmentsubmission
        })),
        exams: c.exam
      }));
      
      return res.json(mapped);
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
            course: {
              some: { teacherId: userId }
            }
          }
        } 
      }),
      prisma.lesson.count({
        where: { course: { teacherId: userId } }
      }),
      prisma.assignmentsubmission.count({
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

    const course = await (prisma as any).course.findUnique({
      where: { id: courseId },
      include: {
        subject: true,
        user: true,
        lesson: { 
          where: role === 'STUDENT' ? { isVisible: true } : undefined,
          orderBy: { order: 'asc' } 
        },
        assignment: {
          include: {
            assignmentsubmission: {
              where: role === 'STUDENT' && studentId ? { studentId: studentId } : undefined,
              include: { student: true }
            }
          }
        },
        exam: {
          include: {
            examresult: {
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
      teacher: (course as any).user,
      lessons: (course as any).lesson,
      assignments: (course as any).assignment?.map((a: any) => ({
        ...a,
        submissions: a.assignmentsubmission
      })),
      exams: (course as any).exam?.map((e: any) => ({
        ...e,
        results: e.examresult
      })),
      isRegistered: !!registration,
      hasEnrollKey: !!(course as any).enrollKey
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

    const submission = await prisma.assignmentsubmission.upsert({
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
        isActive: true,
        updatedAt: new Date()
      },
      include: {
        subject: true,
        user: true
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
        isActive, updatedAt: new Date() }
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
        order: Number(order || 0), updatedAt: new Date()
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
        allowLate: !!allowLate, updatedAt: new Date()
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
        status: 'PUBLISHED', updatedAt: new Date(),
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
    const submission = await prisma.assignmentsubmission.update({
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

    questions.forEach((q: any) => {
      const selectedOptionId = answers[q.id];
      const correctOption = q.options.find((opt: any) => opt.isCorrect);
      if (selectedOptionId && correctOption && Number(selectedOptionId) === correctOption.id) {
        totalPoints += q.points;
      }
    });

    const score = (totalPoints / questions.reduce((sum: number, q: any) => sum + q.points, 0)) * exam.maxPoints;

    const result = await prisma.examresult.upsert({
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
  const role = req.user?.role?.toUpperCase();
  
  if (!studentId) return res.status(400).json({ message: 'Thiếu mã sinh viên' });

  try {
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) }
    });
    if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });

    // Kiểm tra mật khẩu ghi danh (Bỏ qua nếu là Giảng viên hoặc QTV đang ghi danh cho sinh viên)
    if (role === 'STUDENT') {
      const { password } = req.body;
      if (course.enrollKey && course.enrollKey !== password) {
        return res.status(403).json({ message: 'Mật khẩu ghi danh không chính xác' });
      }
    }

    // Kiểm tra xem sinh viên đã đăng ký môn học này trong học kỳ này chưa
    const existing = await prisma.courseRegistration.findUnique({
      where: {
        studentId_subjectId_semesterId: {
          studentId: Number(studentId),
          subjectId: course.subjectId,
          semesterId: course.semesterId
        }
      }
    });

    if (existing) {
      // Nếu đã đăng ký rồi thì trả về thông tin cũ (Idempotent) thay vì báo lỗi
      return res.status(200).json(existing);
    }

    const registration = await prisma.courseRegistration.create({
      data: {
        studentId: Number(studentId),
        subjectId: course.subjectId,
        semesterId: course.semesterId,
        status: 'APPROVED', updatedAt: new Date()
      }
    });
    res.status(201).json(registration);
  } catch (error: any) {
    console.error('Enroll student error:', error);
    res.status(500).json({ error: 'Lỗi ghi danh: ' + (error.message || 'Unknown error') });
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

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const courseId = Number(id);
  const role = req.user?.role?.toUpperCase();
  const userId = Number(req.user?.id);

  if (isNaN(courseId)) return res.status(400).json({ error: 'ID khóa học không hợp lệ' });

  try {
    const course = await prisma.course.findUnique({ 
      where: { id: courseId },
      include: {
        exam: { include: { examquestion: true } },
        assignment: true,
        lesson: true
      }
    });

    if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });

    // Quyền: QTV hoặc Giảng viên sở hữu
    if (role !== 'QTV' && course.teacherId !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa khóa học này' });
    }

    // Thực hiện xóa cascade trong một transaction với timeout cao hơn
    await prisma.$transaction(async (tx: any) => {
      const examIds = (course.exam || []).map((e: any) => e.id);
      const assignmentIds = (course.assignment || []).map((a: any) => a.id);
      const lessonIds = (course.lesson || []).map((l: any) => l.id);

      // 1. Xóa các dữ liệu liên quan đến đề thi
      if (examIds.length > 0) {
        await tx.examresult.deleteMany({ where: { examId: { in: examIds } } });
        
        const questions = await tx.examquestion.findMany({ 
          where: { examId: { in: examIds } },
          select: { id: true }
        });
        const questionIds = questions.map((q: any) => q.id);
        
        if (questionIds.length > 0) {
          await tx.examoption.deleteMany({ where: { questionId: { in: questionIds } } });
        }
        
        await tx.examquestion.deleteMany({ where: { examId: { in: examIds } } });
        await tx.exam.deleteMany({ where: { id: { in: examIds } } });
      }

      // 2. Xóa các dữ liệu liên quan đến bài tập
      if (assignmentIds.length > 0) {
        await tx.assignmentsubmission.deleteMany({ where: { assignmentId: { in: assignmentIds } } });
        await tx.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
      }

      // 3. Xóa bài giảng
      if (lessonIds.length > 0) {
        await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });
      }

      // 4. Cuối cùng xóa khóa học
      await tx.course.delete({ where: { id: courseId } });
    }, {
      timeout: 10000 // 10 seconds
    });

    res.json({ message: 'Đã xóa khóa học thành công' });
  } catch (error: any) {
    console.error('Delete course error:', error);
    res.status(500).json({ 
      error: 'Lỗi máy chủ khi xóa khóa học: ' + (error.message || 'Unknown error'),
      code: error.code
    });
  }
};
