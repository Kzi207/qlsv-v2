import crypto from 'crypto';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

const EARTH_RADIUS_METERS = 6371e3;

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

const parseFiniteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeClassId = (value: unknown) => String(value || '').trim().toUpperCase();

const normalizeIp = (value: string) =>
  String(value || '')
    .trim()
    .replace(/^::ffff:/, '')
    .replace(/^::1$/, '127.0.0.1')
    .toLowerCase();

const extractClientIp = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for'];
  const rawForwarded = Array.isArray(forwarded) ? forwarded[0] || '' : String(forwarded || '');
  const firstForwarded = rawForwarded.split(',')[0]?.trim() || '';
  const fallbackIp = String(req.ip || '').trim();
  return normalizeIp(firstForwarded || fallbackIp || 'unknown');
};

const parseDayRange = (value?: string) => {
  const selectedDate = value ? new Date(value) : new Date();
  if (Number.isNaN(selectedDate.getTime())) {
    return null;
  }

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

const getRequestRole = (req: AuthRequest) => String(req.user?.role || '').toUpperCase();

const getStudentIdFromRequest = (req: AuthRequest) => Number(req.user?.studentId);

const getManagedClassId = (req: AuthRequest, requestedClassId?: string, required = false) => {
  const role = getRequestRole(req);
  const normalizedRequested = normalizeClassId(requestedClassId);

  if (role === 'BCH') {
    const ownClassId = normalizeClassId(req.user?.class_id);
    
    // If just listing (not required), don't 403 if class is missing, just return a dummy
    if (!ownClassId) {
      if (required) {
        return { error: { status: 403, message: 'Tài khoản BCH chưa được gán lớp quản lý' } };
      }
      return { classId: '___NONE___' };
    }

    if (normalizedRequested && normalizedRequested !== ownClassId) {
      return { error: { status: 403, message: 'BCH chỉ được thao tác trên lớp được phân công' } };
    }

    return { classId: ownClassId };
  }

  if (required && !normalizedRequested) {
    return { error: { status: 400, message: 'Vui lòng chọn lớp' } };
  }

  return { classId: normalizedRequested || undefined };
};

const ensureSessionAccess = (req: AuthRequest, sessionClassId?: string | null) => {
  const role = getRequestRole(req);
  if (role !== 'BCH') return null;

  if (!sessionClassId) {
    return { status: 403, message: 'Phien cu chua duoc gan lop, BCH khong duoc truy cap' };
  }

  const ownClassId = normalizeClassId(req.user?.class_id);
  if (!ownClassId || ownClassId !== normalizeClassId(sessionClassId)) {
    return { status: 403, message: 'BCH khong duoc xem phien cua lop khac' };
  }

  return null;
};

const logQrRisk = async (params: {
  req: AuthRequest;
  reason: string;
  sessionId?: number | null;
  studentId?: number | null;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  details?: Record<string, unknown>;
}) => {
  try {
    const { req, reason, sessionId, studentId, severity = 'MEDIUM', details } = params;
    const userId = Number(req.user?.id || 0);
    const normalizedUserId = Number.isFinite(userId) && userId > 0 ? userId : undefined;

    await (prisma as any).auditlog.create({
      data: {
        userId: normalizedUserId,
        action: 'QR_RISK',
        targetType: 'AttendanceSession',
        targetId: sessionId ? String(sessionId) : undefined,
        details: {
          reason,
          severity,
          studentId: studentId || undefined,
          path: req.path,
          ...(details || {}),
        },
        ipAddress: extractClientIp(req),
        userAgent: String(req.headers['user-agent'] || ''),
      },
    });
  } catch (error) {
    console.error('logQrRisk error:', error);
  }
};

export const checkAttendance = async (req: Request, res: Response) => {
  const { student_id, date, status } = req.body;
  const dayRange = parseDayRange(date);

  if (!dayRange) {
    return res.status(400).json({ message: 'Ngay diem danh khong hop le' });
  }

  try {
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        student_id: Number(student_id),
        session_id: null,
        date: {
          gte: dayRange.startOfDay,
          lte: dayRange.endOfDay,
        },
      },
    });

    if (existingAttendance) {
      const updatedAttendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { status, updatedAt: new Date() },
      });
      return res.json(updatedAttendance);
    }

    const attendance = await prisma.attendance.create({
      data: {
        student_id: Number(student_id),
        date: new Date(date),
        status,
        updatedAt: new Date(),
      },
    });

    return res.status(201).json(attendance);
  } catch (error) {
    console.error('checkAttendance error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAttendanceByDate = async (req: Request, res: Response) => {
  const { date, classId } = req.query;
  const dayRange = parseDayRange(typeof date === 'string' ? date : undefined);

  if (!dayRange) {
    return res.status(400).json({ message: 'Ngay loc khong hop le' });
  }

  const normalizedClassId = normalizeClassId(classId);

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: dayRange.startOfDay,
          lte: dayRange.endOfDay,
        },
        student: normalizedClassId
          ? {
              class_id: normalizedClassId,
            }
          : undefined,
      },
      include: {
        student: true,
        session: {
          include: {
            Renamedclass: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }],
    });

    return res.json(attendance);
  } catch (error) {
    console.error('getAttendanceByDate error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAttendanceByStudent = async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const numericStudentId = Number(studentId);

  if (!Number.isFinite(numericStudentId) || numericStudentId <= 0) {
    return res.status(400).json({ message: 'Invalid student ID' });
  }

  try {
    const attendance = await prisma.attendance.findMany({
      where: { student_id: numericStudentId },
      include: {
        session: {
          include: {
            Renamedclass: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json(attendance);
  } catch (error) {
    console.error('getAttendanceByStudent error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createAttendanceSession = async (req: AuthRequest, res: Response) => {
  const { title, subject, sessionDate, lat, lng, radius, class_id } = req.body;
  const managedClassResult = getManagedClassId(req, class_id, true);

  if (managedClassResult.error) {
    return res.status(managedClassResult.error.status).json({ message: managedClassResult.error.message });
  }

  const parsedLat = parseFiniteNumber(lat);
  const parsedLng = parseFiniteNumber(lng);
  const parsedRadius = parseFiniteNumber(radius);
  const normalizedClassId = managedClassResult.classId as string;
  const parsedSessionDate = sessionDate ? new Date(sessionDate) : new Date();

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Vui long nhap ten phien diem danh' });
  }

  if (
    parsedLat === null ||
    parsedLng === null ||
    parsedRadius === null ||
    parsedRadius <= 0 ||
    Number.isNaN(parsedSessionDate.getTime())
  ) {
    return res.status(400).json({ message: 'Du lieu vi tri hoac ban kinh khong hop le' });
  }

  try {
    const targetClass = await (prisma as any).renamedclass.findUnique({
      where: { name: normalizedClassId },
    });

    if (!targetClass) {
      return res.status(404).json({ message: 'Khong tim thay lop da chon' });
    }

    const qrToken = crypto.randomBytes(32).toString('hex');

    const session = await prisma.$transaction(async (tx: any) => {
      await (tx as any).attendancesession.updateMany({
        where: {
          class_id: normalizedClassId,
          isActive: true,
        },
        data: {
          isActive: false,
          endedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return (tx as any).attendancesession.create({
        data: {
          title: String(title).trim(),
          subject: String(subject || '').trim(),
          sessionDate: parsedSessionDate,
          lat: parsedLat,
          lng: parsedLng,
          radius: parsedRadius,
          qrToken,
          class_id: normalizedClassId,
          updatedAt: new Date(),
        },
        include: {
          Renamedclass: true,
        },
      });
    });

    return res.status(201).json(session);
  } catch (error) {
    console.error('createAttendanceSession error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAttendanceSessions = async (req: AuthRequest, res: Response) => {
  const { classId, isActive, date, limit } = req.query;
  const managedClassResult = getManagedClassId(req, typeof classId === 'string' ? classId : undefined, false);

  if (managedClassResult.error) {
    return res.status(managedClassResult.error.status).json({ message: managedClassResult.error.message });
  }

  const numericLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const normalizedClassId = managedClassResult.classId;
  const parsedIsActive =
    typeof isActive === 'string'
      ? isActive.toLowerCase() === 'true'
        ? true
        : isActive.toLowerCase() === 'false'
          ? false
          : undefined
      : undefined;
  const dayRange = typeof date === 'string' ? parseDayRange(date) : null;

  try {
    const where: any = {
      isActive: parsedIsActive,
      sessionDate: dayRange
        ? {
            gte: dayRange.startOfDay,
            lte: dayRange.endOfDay,
          }
        : undefined,
    };

    if (normalizedClassId) {
      where.class_id = normalizedClassId;
    } else {
      where.NOT = { class_id: null };
    }

    const sessions = (await (prisma as any).attendancesession.findMany({
      where,
      include: {
        Renamedclass: true,
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { sessionDate: 'desc' }, { createdAt: 'desc' }],
      take: numericLimit,
    })) as any[];

    return res.json(
      sessions.map((session) => ({
        ...session,
        attendeeCount: session._count.attendance,
      })),
    );
  } catch (error) {
    console.error('getAttendanceSessions error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getActiveSessions = async (req: AuthRequest, res: Response) => {
  const role = getRequestRole(req);
  let classIdFilter: string | undefined;

  if (role === 'BCH') {
    const managedClassResult = getManagedClassId(req, undefined, true);
    if (managedClassResult.error) {
      return res.status(managedClassResult.error.status).json({ message: managedClassResult.error.message });
    }
    classIdFilter = managedClassResult.classId;
  }

  if (role === 'STUDENT') {
    const studentId = getStudentIdFromRequest(req);
    if (!Number.isFinite(studentId) || studentId <= 0) {
      return res.status(403).json({ message: 'Only students can view active QR sessions' });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { class_id: true },
    });

    classIdFilter = student?.class_id;
  }

  try {
    const where: any = {
      isActive: true,
    };

    if (classIdFilter) {
      where.class_id = classIdFilter;
    } else {
      where.NOT = { class_id: null };
    }

    const sessions = (await (prisma as any).attendancesession.findMany({
      where,
      include: {
        Renamedclass: true,
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })) as any[];

    return res.json(
      sessions.map((session) => ({
        ...session,
        attendeeCount: session._count.attendance,
      })),
    );
  } catch (error) {
    console.error('getActiveSessions error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const qrCheckIn = async (req: AuthRequest, res: Response) => {
  const { qrToken, lat, lng } = req.body;
  const studentId = getStudentIdFromRequest(req);
  const parsedLat = parseFiniteNumber(lat);
  const parsedLng = parseFiniteNumber(lng);
  const clientIp = extractClientIp(req);
  const deviceInfo = req.headers['user-agent'] || 'unknown';

  if (typeof qrToken !== 'string' || !qrToken.trim()) {
    await logQrRisk({
      req,
      reason: 'MISSING_QR_TOKEN',
      severity: 'LOW',
    });
    return res.status(400).json({ message: 'Thieu ma QR hop le' });
  }

  if (!Number.isFinite(studentId) || studentId <= 0) {
    await logQrRisk({
      req,
      reason: 'INVALID_STUDENT_CONTEXT',
      severity: 'HIGH',
    });
    return res.status(403).json({ message: 'Chi sinh vien moi duoc diem danh QR' });
  }

  if (parsedLat === null || parsedLng === null) {
    return res.status(400).json({ message: 'Vi tri GPS khong hop le' });
  }

  try {
    const session = await (prisma as any).attendancesession.findFirst({
      where: {
        qrToken: qrToken.trim(),
        isActive: true,
        NOT: { class_id: null },
      },
      include: {
        Renamedclass: true,
      },
    });

    if (!session) {
      await logQrRisk({
        req,
        studentId,
        reason: 'INVALID_OR_ENDED_SESSION',
        severity: 'HIGH',
        details: {
          qrTokenPrefix: qrToken.trim().slice(0, 8),
        },
      });
      return res.status(404).json({ message: 'Phien diem danh khong ton tai hoac da ket thuc' });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        attendanceProfile: true,
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Khong tim thay sinh vien' });
    }

    if (!session.class_id) {
      return res.status(400).json({ message: 'Phien diem danh nay chua duoc gan lop hop le' });
    }

    if (normalizeClassId(student.class_id) !== normalizeClassId(session.class_id)) {
      await logQrRisk({
        req,
        sessionId: session.id,
        studentId,
        reason: 'CLASS_MISMATCH',
        severity: 'HIGH',
        details: {
          sessionClass: session.class_id,
          studentClass: student.class_id,
        },
      });
      return res.status(403).json({ message: 'Sinh vien khong thuoc lop cua phien diem danh nay' });
    }

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        student_id: studentId,
        session_id: session.id,
      },
    });

    if (existingAttendance) {
      await logQrRisk({
        req,
        sessionId: session.id,
        studentId,
        reason: 'DUPLICATE_CHECK_IN',
        severity: 'LOW',
      });
      return res.status(400).json({ message: 'Sinh vien da diem danh cho phien nay' });
    }

    const sessionDistance = getDistance(parsedLat, parsedLng, session.lat, session.lng);
    if (sessionDistance > session.radius) {
      await logQrRisk({
        req,
        sessionId: session.id,
        studentId,
        reason: 'OUTSIDE_SESSION_RADIUS',
        severity: 'HIGH',
        details: {
          sessionDistance: Math.round(sessionDistance),
          radius: Math.round(session.radius),
        },
      });
      return res.status(400).json({
        message: 'Vi tri hien tai nam ngoai ban kinh cho phep cua lop hoc',
        distance: Math.round(sessionDistance),
        limit: Math.round(session.radius),
      });
    }

    const attendanceProfile = student.attendanceProfile;
    const baselineCreated = !attendanceProfile;
    let verifiedIp = true;
    let verifiedLocation = true;
    let profileDistance: number | null = null;

    if (attendanceProfile) {
      if (normalizeIp(attendanceProfile.firstIpAddress) !== 'unknown') {
        verifiedIp = normalizeIp(attendanceProfile.firstIpAddress) === normalizeIp(clientIp);
      }

      profileDistance = getDistance(
        parsedLat,
        parsedLng,
        attendanceProfile.firstLatitude,
        attendanceProfile.firstLongitude,
      );
      verifiedLocation = profileDistance <= session.radius;

      if (!verifiedIp) {
        await logQrRisk({
          req,
          sessionId: session.id,
          studentId,
          reason: 'IP_MISMATCH',
          severity: 'HIGH',
          details: {
            currentIp: clientIp,
            baselineIp: attendanceProfile.firstIpAddress,
          },
        });
        return res.status(400).json({ message: 'IP hien tai khong khop voi lan xac minh dau tien' });
      }

      if (!verifiedLocation) {
        await logQrRisk({
          req,
          sessionId: session.id,
          studentId,
          reason: 'PROFILE_LOCATION_MISMATCH',
          severity: 'HIGH',
          details: {
            profileDistance: profileDistance ? Math.round(profileDistance) : null,
            radius: Math.round(session.radius),
          },
        });
        return res.status(400).json({
          message: 'Vi tri hien tai khong khop voi toa do da luu tren he thong',
          profileDistance: Math.round(profileDistance),
          limit: Math.round(session.radius),
        });
      }
    }

    const attendance = await prisma.$transaction(async (tx: any) => {
      if (!attendanceProfile) {
        await tx.studentAttendanceProfile.create({
          data: {
            student_id: studentId,
            firstIpAddress: clientIp,
            firstLatitude: parsedLat,
            firstLongitude: parsedLng,
            lastIpAddress: clientIp,
            lastLatitude: parsedLat,
            lastLongitude: parsedLng,
            lastCheckInAt: new Date(),
            totalVerifiedCheckIns: 1,
          },
        });
      } else {
        await tx.studentAttendanceProfile.update({
          where: { student_id: studentId },
          data: {
            lastIpAddress: clientIp,
            lastLatitude: parsedLat,
            lastLongitude: parsedLng,
            lastCheckInAt: new Date(),
            totalVerifiedCheckIns: {
              increment: 1,
            },
          },
        });
      }

      return tx.attendance.create({
        data: {
          student_id: studentId,
          session_id: session.id,
          status: 'present',
          ipAddress: clientIp,
          latitude: parsedLat,
          longitude: parsedLng,
          deviceInfo,
          baselineCreated,
          verifiedIp,
          verifiedLocation,
          profileDistance,
          sessionDistance,
          updatedAt: new Date(),
        },
        include: {
          student: true,
          session: {
            include: {
              Renamedclass: true,
            },
          },
        },
      });
    });

    return res.status(201).json({
      attendance,
      verification: {
        baselineCreated,
        verifiedIp,
        verifiedLocation,
        sessionDistance: Math.round(sessionDistance),
        profileDistance: profileDistance === null ? null : Math.round(profileDistance),
      },
    });
  } catch (error) {
    console.error('qrCheckIn error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getSessionAttendees = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const numericSessionId = Number(sessionId);

  if (!Number.isFinite(numericSessionId) || numericSessionId <= 0) {
    return res.status(400).json({ message: 'Session ID khong hop le' });
  }

  try {
    const session = await (prisma as any).attendancesession.findUnique({
      where: { id: numericSessionId },
      select: {
        class_id: true,
      },
    });

    if (!session) {
      return res.status(404).json({ message: 'Khong tim thay phien diem danh' });
    }

    const accessError = ensureSessionAccess(req, session.class_id);
    if (accessError) {
      return res.status(accessError.status).json({ message: accessError.message });
    }

    const attendees = await prisma.attendance.findMany({
      where: { session_id: numericSessionId },
      include: {
        student: true,
      },
      orderBy: { date: 'asc' },
    });

    return res.json(attendees);
  } catch (error) {
    console.error('getSessionAttendees error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getSessionSummary = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const numericSessionId = Number(sessionId);

  if (!Number.isFinite(numericSessionId) || numericSessionId <= 0) {
    return res.status(400).json({ message: 'Session ID khong hop le' });
  }

  try {
    const session = await (prisma as any).attendancesession.findUnique({
      where: { id: numericSessionId },
      include: {
        Renamedclass: true,
      },
    });

    if (!session) {
      return res.status(404).json({ message: 'Khong tim thay phien diem danh' });
    }

    const accessError = ensureSessionAccess(req, session.class_id);
    if (accessError) {
      return res.status(accessError.status).json({ message: accessError.message });
    }

    if (!session.class_id) {
      return res.status(400).json({ message: 'Phien diem danh cu nay chua duoc gan lop' });
    }

    const [students, attendances, riskLogs] = await Promise.all([
      prisma.student.findMany({
        where: {
          class_id: session.class_id,
        },
        include: {
          attendanceProfile: true,
        },
        orderBy: [{ order_number: 'asc' }, { name: 'asc' }],
      }),
      prisma.attendance.findMany({
        where: {
          session_id: numericSessionId,
        },
        include: {
          student: true,
        },
        orderBy: [{ date: 'asc' }],
      }),
      prisma.auditLog.findMany({
        where: {
          action: 'QR_RISK',
          targetType: 'AttendanceSession',
          targetId: String(numericSessionId),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 20,
      }),
    ]);

    const attendanceMap = new Map(attendances.map((attendance: any) => [attendance.student_id, attendance]));
    const checkedIn = attendances.length;
    const totalStudents = students.length;
    const absentCount = Math.max(totalStudents - checkedIn, 0);
    const attendanceRate = totalStudents > 0 ? Number(((checkedIn / totalStudents) * 100).toFixed(2)) : 0;
    const suspiciousCheckIns = attendances.filter((item: any) => {
      if (typeof item.sessionDistance !== 'number') return false;
      return item.sessionDistance >= session.radius * 0.85;
    }).length;

    return res.json({
      session,
      stats: {
        totalStudents,
        checkedIn,
        absentCount,
        attendanceRate,
        baselineCreatedCount: attendances.filter((item: any) => item.baselineCreated).length,
        verifiedIpCount: attendances.filter((item: any) => item.verifiedIp !== false).length,
        verifiedLocationCount: attendances.filter((item: any) => item.verifiedLocation !== false).length,
        suspiciousCheckIns,
        riskAttempts: riskLogs.length,
      },
      riskWarnings: riskLogs.map((item: any) => ({
        id: item.id,
        createdAt: item.createdAt,
        actor: item.user
          ? {
              id: item.user.id,
              name: item.user.name,
              username: item.user.username,
            }
          : null,
        details: item.details,
      })),
      students: students.map((student: any) => {
        const attendance = attendanceMap.get(student.id);
        return {
          id: student.id,
          name: student.name,
          student_code: student.student_code,
          class_id: student.class_id,
          order_number: student.order_number,
          attendance: attendance
            ? {
                id: (attendance as any).id,
                status: (attendance as any).status,
                checkedInAt: (attendance as any).date,
                ipAddress: (attendance as any).ipAddress,
                latitude: (attendance as any).latitude,
                longitude: (attendance as any).longitude,
                baselineCreated: (attendance as any).baselineCreated,
                verifiedIp: (attendance as any).verifiedIp,
                verifiedLocation: (attendance as any).verifiedLocation,
                profileDistance: (attendance as any).profileDistance,
                sessionDistance: (attendance as any).sessionDistance,
              }
            : null,
          profile: student.attendanceProfile
            ? {
                firstIpAddress: student.attendanceProfile.firstIpAddress,
                firstLatitude: student.attendanceProfile.firstLatitude,
                firstLongitude: student.attendanceProfile.firstLongitude,
                firstCheckInAt: student.attendanceProfile.firstCheckInAt,
                lastCheckInAt: student.attendanceProfile.lastCheckInAt,
                totalVerifiedCheckIns: student.attendanceProfile.totalVerifiedCheckIns,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error('getSessionSummary error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const endAttendanceSession = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const numericSessionId = Number(sessionId);

  if (!Number.isFinite(numericSessionId) || numericSessionId <= 0) {
    return res.status(400).json({ message: 'Session ID khong hop le' });
  }

  try {
    const session = await (prisma as any).attendancesession.findUnique({
      where: { id: numericSessionId },
      select: {
        class_id: true,
      },
    });

    if (!session) {
      return res.status(404).json({ message: 'Khong tim thay phien diem danh' });
    }

    const accessError = ensureSessionAccess(req, session.class_id);
    if (accessError) {
      return res.status(accessError.status).json({ message: accessError.message });
    }

    const updatedSession = await (prisma as any).attendancesession.update({
      where: { id: numericSessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        Renamedclass: true,
      },
    });

    return res.json(updatedSession);
  } catch (error) {
    console.error('endAttendanceSession error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
