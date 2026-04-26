import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      },
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
