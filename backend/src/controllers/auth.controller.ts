import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';
import { clearAuthCookies, createCsrfToken, setAuthCookies, setCsrfCookie, getCookieValue, CSRF_COOKIE_NAME } from '../utils/security';
import { decrypt } from '../utils/crypto';
import { logAudit } from '../utils/logger';

const getJwtSecret = () => process.env.JWT_SECRET || 'secret';

const toSafeUser = (user: any) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: String(user.role || '').toUpperCase(),
  studentId: user.studentId,
  class_id: user.class_id,
  student: user.student ? {
    id: user.student.id,
    mssv: user.student.student_code,
    birthday: decrypt(user.student.birthday),
    gender: decrypt(user.student.gender),
    id_card: decrypt(user.student.id_card),
    hometown: decrypt(user.student.hometown),
    address: decrypt(user.student.address),
    class_id: user.student.class_id
  } : null
});

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        student: true
      }
    });

    if (!user) {
      console.warn(`Login failed: User not found - ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login failed: Password mismatch - ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Map student class_id if it's a student
    if (user.student) {
      (user as any).class_id = user.student.class_id;
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name,
        studentId: user.studentId,
        class_id: user.class_id 
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const csrfToken = createCsrfToken();
    setAuthCookies(req, res, token, csrfToken);

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      req
    });

    res.json({
      user: toSafeUser(user),
      csrfToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      include: {
        student: true
      }
    });

    if (!user) {
      clearAuthCookies(req, res);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Map student class_id if it's a student
    if (user.student) {
      (user as any).class_id = user.student.class_id;
    }

    const safeUser = toSafeUser(user);

    let csrfToken = getCookieValue(req, CSRF_COOKIE_NAME);
    if (!csrfToken) {
      csrfToken = createCsrfToken();
      setCsrfCookie(req, res, csrfToken);
    }

    return res.json({
      user: safeUser,
      csrfToken,
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  if (req.user?.id) {
    await logAudit({
      userId: Number(req.user.id),
      action: 'LOGOUT',
      req
    });
  }
  clearAuthCookies(req, res);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({ message: 'Logged out' });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const name = String(req.body?.name || '').trim();
  const emailValue = typeof req.body?.email === 'string' ? req.body.email.trim() : '';

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(req.user.id) },
      data: {
        name,
        email: emailValue || null,
      },
    });

    return res.json(toSafeUser(updatedUser));
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
