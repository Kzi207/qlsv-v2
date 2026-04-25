import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating roles...');
  
  try {
    // 1. Add new enum values to PostgreSQL directly if needed
    // Note: Prisma enum updates often require raw SQL if not using migrate
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'QTV'`);
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LECTURER'`);
    
    // 2. Update existing ADMIN users to QTV
    // We do this by checking if the value exists first
    const updatedCount = await prisma.$executeRawUnsafe(`UPDATE "User" SET role = 'QTV' WHERE role::text = 'ADMIN'`);
    console.log(`Updated ${updatedCount} users from ADMIN to QTV`);

    // 3. Optional: Remove ADMIN from enum if you really want to, but it's risky without a full migration
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
