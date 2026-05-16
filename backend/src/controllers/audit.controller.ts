import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  const { action, userId, targetType, page = 1, pageSize = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  try {
    const where: any = {};
    
    // Role-based visibility
    if (req.user?.role !== 'QTV') {
      where.userId = Number(req.user?.id);
    } else {
      // QTV can filter by any user, otherwise see all
      if (userId) where.userId = Number(userId);
    }

    if (action) where.action = String(action);
    if (targetType) where.targetType = String(targetType);

    const [total, logs] = await Promise.all([
      (prisma as any).auditlog.count({ where }),
      (prisma as any).auditlog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      })
    ]);

    res.json({
      items: logs,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
