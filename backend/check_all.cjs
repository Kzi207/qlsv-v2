const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const allAssignments = await prisma.bchAssignment.findMany({
      include: { bchUser: true }
    });
    console.log('All Assignments:', JSON.stringify(allAssignments, null, 2));

    const bchUsers = await prisma.user.findMany({
      where: { role: 'BCH' }
    });
    console.log('All BCH Users:', JSON.stringify(bchUsers, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
