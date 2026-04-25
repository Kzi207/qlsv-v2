import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating Timetable table...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Timetable" (
        "id" SERIAL PRIMARY KEY,
        "subject" TEXT NOT NULL,
        "teacher" TEXT NOT NULL,
        "room" TEXT NOT NULL,
        "day" INTEGER NOT NULL,
        "startPeriod" INTEGER NOT NULL,
        "endPeriod" INTEGER NOT NULL,
        "classId" TEXT NOT NULL,
        "semesterId" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'offline',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Timetable_classId_semesterId_idx" ON "Timetable"("classId", "semesterId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Timetable_teacher_idx" ON "Timetable"("teacher");`);
    console.log('Table created successfully.');
  } catch (e) {
    console.error('Error creating table:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
