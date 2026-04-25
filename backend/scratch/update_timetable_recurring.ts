import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating Timetable table for recurring logic...');
  try {
    // Add startDate and endDate to Timetable
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Timetable" 
      ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
    `);
    console.log('Columns added successfully.');
  } catch (e) {
    console.error('Error updating table:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
