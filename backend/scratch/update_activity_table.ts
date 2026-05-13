import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating ActivityAttendanceSession table...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ActivityAttendanceSession" ADD COLUMN IF NOT EXISTS "semesterId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ActivityAttendanceSession" ADD COLUMN IF NOT EXISTS "classId" TEXT;`);
    console.log('Table updated successfully.');
  } catch (e) {
    console.error('Error updating table:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
