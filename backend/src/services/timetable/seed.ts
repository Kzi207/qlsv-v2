import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu gieo mầm dữ liệu Xếp Thời Khóa Biểu (Seed Data)...');

  // 1. Tạo Giảng viên (Role LECTURER)
  const passwordHash = await bcrypt.hash('123456', 10);
  
  const gvA = await prisma.user.upsert({
    where: { username: 'gv.nguyenvana' },
    update: {},
    create: {
      username: 'gv.nguyenvana',
      password: passwordHash,
      name: 'ThS. Nguyễn Văn A',
      role: 'LECTURER',
    },
  });

  const gvB = await prisma.user.upsert({
    where: { username: 'gv.tranthib' },
    update: {},
    create: {
      username: 'gv.tranthib',
      password: passwordHash,
      name: 'TS. Trần Thị B',
      role: 'LECTURER',
    },
  });

  const gvC = await prisma.user.upsert({
    where: { username: 'gv.lec' },
    update: {},
    create: {
      username: 'gv.lec',
      password: passwordHash,
      name: 'PGS. TS. Lê C',
      role: 'LECTURER',
    },
  });
  console.log('✅ Đã tạo Giảng viên.');

  // 2. Tạo Môn học (Subjects)
  const subCPlus = await prisma.subject.upsert({
    where: { code: 'INT101' },
    update: {},
    create: {
      code: 'INT101',
      name: 'Lập trình C++',
      credits: 3,
      practicePeriods: 1, // đại diện cho lab
      subjectType: 'PRACTICE'
    },
  });

  const subToanRR = await prisma.subject.upsert({
    where: { code: 'MAT101' },
    update: {},
    create: {
      code: 'MAT101',
      name: 'Toán Rời Rạc',
      credits: 2,
      theoryPeriods: 2,
      subjectType: 'LECTURE'
    },
  });

  const subCTDL = await prisma.subject.upsert({
    where: { code: 'INT102' },
    update: {},
    create: {
      code: 'INT102',
      name: 'Cấu trúc dữ liệu',
      credits: 3,
      theoryPeriods: 3,
      subjectType: 'LECTURE'
    },
  });

  const subAI = await prisma.subject.upsert({
    where: { code: 'INT103' },
    update: {},
    create: {
      code: 'INT103',
      name: 'Trí tuệ nhân tạo',
      credits: 3,
      theoryPeriods: 3,
      subjectType: 'LECTURE'
    },
  });
  console.log('✅ Đã tạo Môn học.');

  // 3. Phân công Giảng dạy (TeachingAssignments)
  const assignments = [
    { userId: gvA.id, subjectId: subCPlus.id },
    { userId: gvA.id, subjectId: subCTDL.id },
    { userId: gvA.id, subjectId: subAI.id },
    { userId: gvB.id, subjectId: subToanRR.id },
    { userId: gvC.id, subjectId: subAI.id },
  ];

  for (const asg of assignments) {
    await prisma.teachingAssignment.upsert({
      where: {
        userId_subjectId: {
          userId: asg.userId,
          subjectId: asg.subjectId,
        }
      },
      update: {},
      create: asg
    });
  }
  console.log('✅ Đã phân công Giảng viên dạy các môn.');

  // 4. Tạo một vài Lớp Sinh Viên (Classes)
  const classIT1 = await prisma.class.upsert({
    where: { name: 'IT01' },
    update: {},
    create: { name: 'IT01' }
  });

  const classIT2 = await prisma.class.upsert({
    where: { name: 'IT02' },
    update: {},
    create: { name: 'IT02' }
  });

  console.log('✅ Đã tạo các Lớp sinh viên IT01, IT02.');

  // 5. Tạo một vài Phòng học (Rooms)
  await prisma.room.upsert({
    where: { name: 'Lab 1' },
    update: {},
    create: { name: 'Lab 1', capacity: 40, type: 'lab' }
  });

  await prisma.room.upsert({
    where: { name: 'A1-101' },
    update: {},
    create: { name: 'A1-101', capacity: 100, type: 'lecture' }
  });

  console.log('✅ Đã tạo Phòng học.');

  console.log('🎉 Đã seed xong dữ liệu vào Database thật!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
