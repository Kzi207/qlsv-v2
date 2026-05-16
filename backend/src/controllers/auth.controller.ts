import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';
import { clearAuthCookies, createCsrfToken, setAuthCookies, setCsrfCookie, getCookieValue, CSRF_COOKIE_NAME, AUTH_COOKIE_NAME } from '../utils/security';
import { decrypt } from '../utils/crypto';
import { logAudit } from '../utils/logger';

const getJwtSecret = () => process.env.JWT_SECRET || 'secret';
const EXPERIENCE_CLASS_ID = 'CNDT2411';

const toSafeUser = (user: any) => ({
  id: user.id,
  username: user.username,
  name: user.role === 'STUDENT' && user.student ? user.student.name : user.name,
  email: user.email,
  phone: user.phone,
  role: String(user.role || '').toUpperCase(),
  studentId: user.studentId,
  class_id: user.class_id,
  major_name: user.major_name,
  student: user.student ? {
    id: user.student.id,
    mssv: user.student.student_code,
    name: user.student.name,
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

    console.log('Login attempt for username:', username);
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        student: {
          include: {
            class: {
              include: {
                major: true
              }
            }
          }
        }
      }
    });
    console.log('User found in DB:', user ? 'YES' : 'NO');

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
      (user as any).major_name = user.student.Renamedclass?.major?.name;
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
    console.error('Login error full details:', error);
    res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? String(error) : undefined });
  }
};

export const register = async (req: Request, res: Response) => {
  const name = String(req.body?.name || '').trim();
  const usernameRaw = String(req.body?.username || '').trim();
  const emailRaw = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!name || !usernameRaw || !emailRaw || !password) {
    return res.status(400).json({ message: 'Name, username, email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailRaw)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const username = usernameRaw.toUpperCase();

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: emailRaw },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingUser.email === emailRaw) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { student_code: username },
          { email: emailRaw },
        ],
      },
      select: {
        id: true,
        student_code: true,
        email: true,
      },
    });

    if (existingStudent) {
      if (existingStudent.student_code === username) {
        return res.status(400).json({ message: 'Student code already exists' });
      }
      if (existingStudent.email === emailRaw) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    await (prisma as any).renamedclass.upsert({
      where: { name: EXPERIENCE_CLASS_ID },
      update: { updatedAt: new Date() },
      create: {
        name: EXPERIENCE_CLASS_ID,
        updatedAt: new Date(),
      },
    });

    const classSize = await prisma.student.count({
      where: { class_id: EXPERIENCE_CLASS_ID },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        name,
        student_code: username,
        email: emailRaw,
        class_id: EXPERIENCE_CLASS_ID,
        order_number: classSize + 1,
        updatedAt: new Date(),
      },
    });

    let createdUser: any = null;
    try {
      createdUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name,
          email: emailRaw,
          role: 'STUDENT',
          studentId: student.id,
          class_id: EXPERIENCE_CLASS_ID,
          updatedAt: new Date(),
        },
      });
    } catch (userError) {
      await prisma.student.delete({
        where: { id: student.id },
      });
      throw userError;
    }

    await logAudit({
      userId: createdUser.id,
      action: 'TEMP_EXPERIENCE_REGISTER',
      targetType: 'student',
      targetId: String(student.id),
      details: {
        class_id: EXPERIENCE_CLASS_ID,
        username,
      },
      req,
    });

    return res.status(201).json({
      message: `Registration successful. You were assigned to class ${EXPERIENCE_CLASS_ID}`,
      account: {
        username,
        class_id: EXPERIENCE_CLASS_ID,
      },
    });
  } catch (error: any) {
    console.error('Register error full details:', error);

    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Account data already exists' });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const tokenFromCookie = getCookieValue(req, AUTH_COOKIE_NAME);
  const tokenFromHeader = req.header('Authorization')?.replace('Bearer ', '');
  const tokenFromQuery = req.query.token as string;
  const token = tokenFromCookie || tokenFromHeader || tokenFromQuery;

  if (!token) {
    return res.json({ user: null, isAuthenticated: false });
  }

  let decodedUser: any = null;
  try {
    decodedUser = jwt.verify(token, getJwtSecret());
  } catch (error) {
    clearAuthCookies(req, res);
    return res.json({ user: null, isAuthenticated: false });
  }

  if (!decodedUser?.id) {
    clearAuthCookies(req, res);
    return res.json({ user: null, isAuthenticated: false });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(decodedUser.id) },
      include: {
        student: {
          include: {
            class: {
              include: {
                major: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      clearAuthCookies(req, res);
      return res.json({ user: null, isAuthenticated: false });
    }

    // Map student class_id and major_name if it's a student
    if (user.student) {
      (user as any).class_id = user.student.class_id;
      (user as any).major_name = user.student.Renamedclass?.major?.name;
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
    console.error('Me error full details:', error);
    return res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? String(error) : undefined });
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
        updatedAt: new Date(),
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
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      },
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
