import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const role = 'LECTURER';
    console.log('Fetching lecturers for role:', role);
    const lecturers = await prisma.$queryRawUnsafe(
      'SELECT id, name, username FROM "User" WHERE role::text = $1',
      role
    );
    console.log('Result:', lecturers);
  } catch (error) {
    console.error('ERROR FETCHING LECTURERS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
