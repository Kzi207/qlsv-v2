import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 5
  });
  console.log('Users found:', users.map(u => ({ id: u.id, username: u.username, role: u.role })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
