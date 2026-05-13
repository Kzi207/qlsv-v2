import { PrismaClient } from './src/generated/client_final/index';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('Connection successful! User count:', userCount);
    
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Sample users:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
