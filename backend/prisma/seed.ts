import { PrismaClient } from '../src/generated/client_final/index';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'System Admin',
      role: 'QTV',
      updatedAt: new Date()
    },
  });

  console.log({ admin });

  // Create Class first and link to major
  // Create Faculty first
  const faculty = await prisma.faculty.upsert({
    where: { code: 'CK' },
    update: {},
    create: {
      code: 'CK',
      name: 'Khoa Cơ khí',
      updatedAt: new Date()
    }
  });

  // Create Major and link to faculty
  const cdtMajor = await prisma.major.upsert({
    where: { code: 'CDT' },
    update: { facultyId: faculty.id },
    create: {
      code: 'CDT',
      name: 'Công nghệ kỹ thuật cơ điện tử',
      facultyId: faculty.id,
      updatedAt: new Date()
    }
  });

  const className = 'CNCD2511';
  await (prisma as any).renamedclass.upsert({
    where: { name: className },
    update: { majorId: cdtMajor.id },
    create: { 
      name: className,
      majorId: cdtMajor.id,
      updatedAt: new Date()
    },
  });

  const student = await prisma.student.upsert({
    where: { student_code: 'CNCD2511016' },
    update: {},
    create: {
      name: 'LÊ KHÁNH DUY',
      student_code: 'CNCD2511016',
      email: 'lkduycncd2511016@student.ctuet.edu.vn',
      class_id: className,
      updatedAt: new Date()
    },
  });

  console.log({ student });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
