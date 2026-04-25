import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Syncing class_id from Student to User table...');
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET class_id = s.class_id
      FROM "Student" s
      WHERE "User"."studentId" = s.id
      AND ("User".class_id IS NULL OR "User".class_id <> s.class_id)
    `);
    console.log(`Successfully synced ${result} users.`);
  } catch (error) {
    console.error('Error syncing class_id:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
