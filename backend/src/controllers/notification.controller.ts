import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

const normalizeLimit = (raw: unknown, fallback = 20, max = 100) => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
};

const toNotificationId = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
};

const buildReadMap = async (userId: number, notificationIds: number[]) => {
  if (!notificationIds.length) return new Set<number>();

  const readLogs = await (prisma as any).auditlog.findMany({
    where: {
      userId,
      action: 'NOTIFICATION_READ',
      targetType: 'Notification',
      targetId: {
        in: notificationIds.map((id) => String(id)),
      },
    },
    select: {
      targetId: true,
    },
  });

  return new Set(
    readLogs
      .map((item: any) => toNotificationId(item.targetId))
      .filter((id: any): id is number => id !== null),
  );
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id || 0);
  const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true';
  const limit = normalizeLimit(req.query.limit, 100, 200);

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const readIds = userId > 0 ? await buildReadMap(userId, notifications.map((item: any) => item.id)) : new Set<number>();

    const mapped = notifications
      .map((item: any) => ({
        ...item,
        isRead: readIds.has(item.id),
      }))
      .filter((item: any) => (unreadOnly ? !item.isRead : true));

    return res.json(mapped);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getNotificationCenter = async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id || 0);
  const limit = normalizeLimit(req.query.limit, 8, 30);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const readIds = await buildReadMap(userId, notifications.map((item: any) => item.id));
    const [totalNotifications, readLogTargets] = await Promise.all([
      prisma.notification.count(),
      (prisma as any).auditlog.findMany({
        where: {
          userId,
          action: 'NOTIFICATION_READ',
          targetType: 'Notification',
        },
        select: {
          targetId: true,
        },
        distinct: ['targetId'],
      }),
    ]);

    const uniqueReadCount = readLogTargets.filter((item: any) => toNotificationId(item.targetId) !== null).length;
    const unreadCount = Math.max(totalNotifications - uniqueReadCount, 0);

    return res.json({
      unreadCount,
      items: notifications.map((item: any) => ({
        ...item,
        isRead: readIds.has(item.id),
      })),
    });
  } catch (error: any) {
    console.error('Failed to fetch notification center:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id || 0);
  const notificationId = toNotificationId(req.params.id);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!notificationId) {
    return res.status(400).json({ message: 'Notification ID is invalid' });
  }

  try {
    const target = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true },
    });

    if (!target) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const existed = await (prisma as any).auditlog.findFirst({
      where: {
        userId,
        action: 'NOTIFICATION_READ',
        targetType: 'Notification',
        targetId: String(notificationId),
      },
      select: { id: true },
    });

    if (!existed) {
      await (prisma as any).auditlog.create({
        data: {
          userId,
          action: 'NOTIFICATION_READ',
          targetType: 'Notification',
          targetId: String(notificationId),
          details: {
            readAt: new Date().toISOString(),
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  const userId = Number(req.user?.id || 0);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const notifications = await prisma.notification.findMany({
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    const readIds = await buildReadMap(userId, notifications.map((item: any) => item.id));
    const unreadIds = notifications.map((item: any) => item.id).filter((id: any) => !readIds.has(id));

    if (unreadIds.length > 0) {
      await (prisma as any).auditlog.createMany({
        data: unreadIds.map((id: any) => ({
          userId,
          action: 'NOTIFICATION_READ',
          targetType: 'Notification',
          targetId: String(id),
          details: {
            bulk: true,
            readAt: new Date().toISOString(),
          },
          ipAddress: req.ip || null,
          userAgent: (req.headers['user-agent'] as string | undefined) || null,
        })),
      });
    }

    return res.json({ success: true, marked: unreadIds.length });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { title, content, tag, color } = req.body;

    if (!title || !tag) {
      return res.status(400).json({ message: 'Title and tag are required' });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        tag,
        color: color || 'blue',
        updatedAt: new Date(),
      },
    });

    return res.status(201).json(notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const notificationId = toNotificationId(req.params.id);

  if (!notificationId) {
    return res.status(400).json({ message: 'Notification ID is invalid' });
  }

  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
    return res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
