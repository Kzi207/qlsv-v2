import type { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

export const getStudentDashboardStats = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.studentId;
  const userId = req.user?.id;
  if (!studentId || !userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) },
      include: {
        grade: true,
        Renamedclass: true,
        trainingscore: {
          orderBy: { semester_id: 'desc' } as any,
          take: 1
        }
      }
    }) as any;

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // 0. Fetch Current Semester Info
    const activeSemesterName = student.Renamedclass?.active_semester_id;
    let daysRemaining = 0;
    if (activeSemesterName) {
      const semester = await prisma.semester.findUnique({ where: { name: activeSemesterName } });
      if (semester?.endDate) {
        const diff = semester.endDate.getTime() - new Date().getTime();
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
    }

    // 0.1 Calculate Attendance Rate
    const totalSessions = await (prisma as any).attendancesession.count({
      where: { class_id: student.class_id, isActive: false } // Only finished sessions
    });
    const presentCount = await prisma.attendance.count({
      where: { student_id: Number(studentId), status: 'PRESENT' }
    });
    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

    // 1. Calculate Earned Credits (out of 160)
    const passedGrades = student.grade.filter((g: any) => (g.totalScore || 0) >= 5);
    const subjects = await prisma.subject.findMany();
    
    let earnedCredits = 0;
    passedGrades.forEach((grade: any) => {
      const subject = subjects.find((s: any) => s.code === grade.subject || s.name === grade.subject);
      if (subject) {
        earnedCredits += subject.credits;
      }
    });

    // 2. Calculate Cumulative GPA
    let totalGradePoints = 0;
    let totalCreditsForGpa = 0;
    
    student.grade.forEach((grade: any) => {
      const subject = subjects.find((s: any) => s.code === grade.subject || s.name === grade.subject);
      if (subject && grade.totalScore !== null) {
        const score = grade.totalScore;
        let gpa4 = 0;
        if (score >= 9) gpa4 = 4.0;
        else if (score >= 8) gpa4 = 3.5;
        else if (score >= 7) gpa4 = 3.0;
        else if (score >= 6) gpa4 = 2.5;
        else if (score >= 5) gpa4 = 2.0;
        
        totalGradePoints += gpa4 * subject.credits;
        totalCreditsForGpa += subject.credits;
      }
    });
    
    const gpa = totalCreditsForGpa > 0 ? (totalGradePoints / totalCreditsForGpa) : 0;

    // 3. Training Score (Latest)
    const latestTrainingScore = student.trainingscore[0]?.total || 0;

    // 4. Today's Schedule
    const today = new Date();
    let day = today.getDay() + 1; 
    const queryDay = day === 1 ? 8 : day;

    const schedule = await prisma.timetable.findMany({
      where: {
        classId: student.class_id,
        day: queryDay
      },
      orderBy: { startPeriod: 'asc' } as any
    });

    // 5. Notifications (Real data from Notification model)
    const notifications = await (prisma as any).notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 6. Timeline (Next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const assignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: sevenDaysFromNow
        },
        course: {
          subject: {
            courseregistration: {
              some: { studentId: Number(studentId) }
            }
          }
        }
      },
      include: {
        course: true
      }
    });

    const activities = await (prisma as any).activityattendancesession.findMany({
      where: {
        isActive: true,
        createdAt: { 
          gte: today,
          lte: sevenDaysFromNow
        }
      }
    });

    const timeline = [
      ...assignments.map((a: any) => ({
        day: getDayShortName(a.dueDate),
        date: formatDate(a.dueDate),
        title: `Deadline: ${a.title} (${a.course.name})`,
        type: 'assignment'
      })),
      ...activities.map((act: any) => ({
        day: getDayShortName(act.createdAt),
        date: formatDate(act.createdAt),
        title: act.title,
        type: 'event',
        join: true
      }))
    ].sort((a, b) => {
      // Very basic sort by date string (could be better)
      return a.date.localeCompare(b.date);
    });

    res.json({
      earnedCredits,
      totalCredits: 160,
      gpa: Math.round(gpa * 100) / 100,
      trainingScore: latestTrainingScore,
      schedule: schedule.map((s: any) => ({
        name: s.subject,
        room: s.room,
        periods: `${s.startPeriod}-${s.endPeriod}`,
        time: getTimeFromPeriods(`${s.startPeriod}-${s.endPeriod}`)
      })),
      notifications: notifications.map((n: any) => ({
        title: n.title,
        tag: n.tag,
        time: getTimeAgo(n.createdAt),
        color: n.color
      })),
      timeline: timeline.slice(0, 5),
      daysRemaining,
      attendanceRate
    });

  } catch (error: any) {
    console.error('getStudentDashboardStats error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getDayShortName = (date: Date) => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[date.getDay()];
};

const formatDate = (date: Date) => {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

const getTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vừa xong";
};

const getTimeFromPeriods = (periods: string) => {
  const map: Record<string, string> = {
    '1-5': '07:30 - 11:30',
    '1-3': '07:30 - 10:00',
    '4-5': '10:15 - 11:30',
    '6-10': '13:00 - 17:00',
    '6-8': '13:00 - 15:30',
    '9-10': '15:45 - 17:00',
    '11-13': '18:00 - 20:30'
  };
  return map[periods] || 'Chưa cập nhật';
};
