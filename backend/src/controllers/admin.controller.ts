import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

type SearchResultItem = {
  id: string;
  type: 'student' | 'class' | 'subject' | 'session' | 'notification' | 'shortcut';
  title: string;
  subtitle?: string;
  route: string;
  badge?: string;
};

const ADMIN_ROLES = new Set(['QTV', 'BCH', 'LECTURER']);

const normalizeKeyword = (value: unknown) => String(value || '').trim();

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDateRangeDays = (days: number) => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - Math.max(days - 1, 0));
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const buildDayBuckets = (days: number) => {
  const { start } = getDateRangeDays(days);
  const buckets: string[] = [];

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.push(d.toISOString().slice(0, 10));
  }

  return buckets;
};

const canAccessAdminFeatures = (req: AuthRequest) => {
  const role = String(req.user?.role || '').toUpperCase();
  return ADMIN_ROLES.has(role);
};

export const globalAdminSearch = async (req: AuthRequest, res: Response) => {
  if (!canAccessAdminFeatures(req)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const keyword = normalizeKeyword(req.query.q);
  const limit = Math.min(Math.max(toNumber(req.query.limit, 6), 1), 15);

  if (keyword.length < 2) {
    return res.json({
      query: keyword,
      items: [
        {
          id: 'shortcut-students',
          type: 'shortcut',
          title: 'Danh sach sinh vien',
          subtitle: 'Quan ly sinh vien',
          route: '/students',
          badge: 'Shortcut',
        },
        {
          id: 'shortcut-attendance',
          type: 'shortcut',
          title: 'Quan ly diem danh QR',
          subtitle: 'Theo doi phien diem danh',
          route: '/attendance/manage',
          badge: 'Shortcut',
        },
        {
          id: 'shortcut-grades',
          type: 'shortcut',
          title: 'Quan ly diem so',
          subtitle: 'Nhap va duyet diem',
          route: '/grades/manage',
          badge: 'Shortcut',
        },
        {
          id: 'shortcut-notifications',
          type: 'shortcut',
          title: 'Thong bao',
          subtitle: 'Trung tam thong bao',
          route: '/notifications',
          badge: 'Shortcut',
        },
      ] as SearchResultItem[],
    });
  }

  try {
    const [students, classes, subjects, sessions, notifications] = await Promise.all([
      prisma.student.findMany({
        where: {
          OR: [
            { name: { contains: keyword } },
            { student_code: { contains: keyword } },
            { class_id: { contains: keyword } },
            { email: { contains: keyword } },
          ],
        },
        select: {
          id: true,
          name: true,
          student_code: true,
          class_id: true,
        },
        take: limit,
        orderBy: [{ class_id: 'asc' }, { order_number: 'asc' }, { name: 'asc' }],
      }),
      prisma.class.findMany({
        where: {
          OR: [
            { name: { contains: keyword } },
            { major: { name: { contains: keyword } } },
          ],
        },
        select: {
          name: true,
          major: {
            select: { name: true },
          },
          _count: {
            select: { student: true },
          },
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.subject.findMany({
        where: {
          OR: [
            { name: { contains: keyword } },
            { code: { contains: keyword } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          credits: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
      (prisma as any).attendancesession.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { subject: { contains: keyword } },
            { class_id: { contains: keyword } },
          ],
        },
        select: {
          id: true,
          title: true,
          subject: true,
          class_id: true,
          isActive: true,
          sessionDate: true,
        },
        take: limit,
        orderBy: [{ isActive: 'desc' }, { sessionDate: 'desc' }],
      }),
      prisma.notification.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
            { tag: { contains: keyword } },
          ],
        },
        select: {
          id: true,
          title: true,
          tag: true,
          createdAt: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const items: SearchResultItem[] = [
      ...students.map((item: any) => ({
        id: `student-${item.id}`,
        type: 'student' as const,
        title: `${item.name} (${item.student_code})`,
        subtitle: `Lop ${item.class_id}`,
        route: '/students',
        badge: 'Sinh vien',
      })),
      ...classes.map((item: any) => ({
        id: `class-${item.name}`,
        type: 'class' as const,
        title: `Lop ${item.name}`,
        subtitle: `${item.major?.name || 'Chua gan nganh'} - ${item._count.student} sinh vien`,
        route: '/classes',
        badge: 'Lop',
      })),
      ...subjects.map((item: any) => ({
        id: `subject-${item.id}`,
        type: 'subject' as const,
        title: `${item.code} - ${item.name}`,
        subtitle: `${item.credits} tin chi`,
        route: '/academic/manage',
        badge: 'Mon hoc',
      })),
      ...sessions.map((item: any) => ({
        id: `session-${item.id}`,
        type: 'session' as const,
        title: item.title,
        subtitle: `[${item.class_id || 'N/A'}] ${item.subject || 'Khong co mon'} - ${new Date(item.sessionDate).toLocaleDateString('vi-VN')}`,
        route: '/attendance/manage',
        badge: item.isActive ? 'Dang mo' : 'Da dong',
      })),
      ...notifications.map((item: any) => ({
        id: `notification-${item.id}`,
        type: 'notification' as const,
        title: item.title,
        subtitle: `${item.tag} - ${new Date(item.createdAt).toLocaleDateString('vi-VN')}`,
        route: '/notifications',
        badge: 'Thong bao',
      })),
    ];

    return res.json({
      query: keyword,
      items: items.slice(0, limit * 4),
    });
  } catch (error) {
    console.error('globalAdminSearch error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  if (!canAccessAdminFeatures(req)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const role = String(req.user?.role || '').toUpperCase();
  const classIdForBch = role === 'BCH' ? String(req.user?.class_id || '').trim().toUpperCase() : '';
  const classFilter = classIdForBch ? { class_id: classIdForBch } : {};
  const { start: trendStart } = getDateRangeDays(7);
  const { start: last24h } = getDateRangeDays(1);
  const dayBuckets = buildDayBuckets(7);

  try {
    const [
      totalStudents,
      totalClasses,
      totalSubjects,
      activeQrSessions,
      pendingTraining,
      approvedTraining,
      notificationsToday,
      fraudAlerts24h,
      recentAttendances,
      recentSessions,
      classStudentCounts,
      recentFraudLogs,
    ] = await Promise.all([
      prisma.student.count({ where: classFilter }),
      prisma.class.count(),
      prisma.subject.count(),
      (prisma as any).attendancesession.count({
        where: {
          isActive: true,
          ...(classIdForBch ? { class_id: classIdForBch } : {}),
        },
      }),
      (prisma as any).trainingscore.count({
        where: {
          status: 'PENDING',
          ...(classIdForBch ? { student: { class_id: classIdForBch } } : {}),
        },
      }),
      (prisma as any).trainingscore.count({
        where: {
          status: 'APPROVED',
          ...(classIdForBch ? { student: { class_id: classIdForBch } } : {}),
        },
      }),
      prisma.notification.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      (prisma as any).auditlog.count({
        where: {
          action: 'QR_RISK',
          createdAt: { gte: last24h },
        },
      }),
      prisma.attendance.findMany({
        where: {
          createdAt: { gte: trendStart },
          ...(classIdForBch
            ? {
                attendancesession: {
                  class_id: classIdForBch,
                },
              }
            : {}),
        },
        select: {
          createdAt: true,
        },
      }),
      (prisma as any).attendancesession.findMany({
        where: {
          sessionDate: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
          ...(classIdForBch ? { class_id: classIdForBch } : {}),
        },
        select: {
          id: true,
          class_id: true,
          _count: {
            select: { attendance: true },
          },
        },
      }),
      prisma.class.findMany({
        select: {
          name: true,
          _count: {
            select: { student: true },
          },
        },
      }),
      (prisma as any).auditlog.findMany({
        where: {
          action: 'QR_RISK',
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
    ]);

    const classSizeMap = new Map<string, number>(classStudentCounts.map((c: any) => [c.name, c._count.student]));
    const classRateAccumulator = new Map<
      string,
      { checkIns: number; expected: number; sessions: number }
    >();

    for (const session of recentSessions) {
      if (!session.class_id) continue;
      const classSize = classSizeMap.get(session.class_id) || 0;
      const expected = classSize > 0 ? classSize : 1;
      const existing = classRateAccumulator.get(session.class_id) || {
        checkIns: 0,
        expected: 0,
        sessions: 0,
      };

      (existing as any).checkIns += (session as any)._count.attendance;
      (existing as any).expected += expected;
      (existing as any).sessions += 1;
      classRateAccumulator.set(session.class_id, existing as any);
    }

    const topClassesByAttendance = Array.from(classRateAccumulator.entries())
      .map(([classId, value]) => ({
        classId,
        sessions: value.sessions,
        attendanceRate:
          value.expected > 0 ? Number(((value.checkIns / value.expected) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 6);

    const attendanceTrendMap = new Map<string, number>();
    for (const day of dayBuckets) {
      attendanceTrendMap.set(day, 0);
    }
    for (const item of recentAttendances) {
      const key = item.createdAt.toISOString().slice(0, 10);
      attendanceTrendMap.set(key, (attendanceTrendMap.get(key) || 0) + 1);
    }

    const attendanceTrend = dayBuckets.map((day) => ({
      date: day,
      checkIns: attendanceTrendMap.get(day) || 0,
    }));

    return res.json({
      overview: {
        totalStudents,
        totalClasses,
        totalSubjects,
        activeQrSessions,
        pendingTraining,
        approvedTraining,
        notificationsToday,
        fraudAlerts24h,
      },
      attendanceTrend,
      topClassesByAttendance,
      fraudWarnings: recentFraudLogs.map((log: any) => ({
        id: log.id,
        createdAt: log.createdAt,
        actorName: log.user?.name || log.user?.username || 'Unknown',
        targetId: log.targetId,
        details: log.details,
      })),
    });
  } catch (error) {
    console.error('getAdminAnalytics error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

