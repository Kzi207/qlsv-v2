import prisma from '../utils/prisma';

export const logAudit = async (params: {
  userId?: number;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  req?: any;
}) => {
  try {
    const { userId, action, targetType, targetId, details, req } = params;
    
    let ipAddress = req?.ip || req?.headers?.['x-forwarded-for'];
    if (Array.isArray(ipAddress)) ipAddress = ipAddress[0];
    
    const userAgent = req?.headers?.['user-agent'];

    await (prisma as any).auditlog.create({
      data: {
        userId,
        action,
        targetType,
        targetId: targetId ? String(targetId) : undefined,
        details: details || {},
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
