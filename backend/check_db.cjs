const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const bchUsers = await prisma.user.findMany({
      where: { role: 'BCH' }
    });
    console.log('BCH Users:', JSON.stringify(bchUsers, null, 2));

    const assignments = await prisma.bchAssignment.findMany();
    console.log('Assignments:', JSON.stringify(assignments, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
