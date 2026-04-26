const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 152; // bch1
  const userClassId = null;

  try {
    const assignments = await prisma.bchAssignment.findMany({
      where: { bchUserId: userId }
    });
    console.log('Assignments:', JSON.stringify(assignments, null, 2));

    let where = { status: 'PENDING' };
    
    if (assignments.length > 0) {
      const assignmentFilters = assignments.map(a => ({
        student: {
          class_id: a.classId,
          order_number: {
            gte: a.fromOrder,
            lte: a.toOrder
          }
        }
      }));
      where.OR = assignmentFilters;
    }

    console.log('Query Where:', JSON.stringify(where, null, 2));

    const results = await prisma.activityEvidence.findMany({
      where,
      include: { student: true }
    });

    console.log('Results count:', results.length);
    if (results.length > 0) {
      console.log('First result student:', results[0].student.name, 'STT:', results[0].student.order_number);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
