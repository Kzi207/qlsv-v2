import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { role: 'LECTURER' } });
  console.log(users.length);
}
main();
