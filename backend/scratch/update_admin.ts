
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    await prisma.user.update({
      where: { username: 'admin' },
      data: { role: 'ADMIN' }
    });
    console.log('Admin user role updated to ADMIN');
  } catch (error) {
    console.error('Error updating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
