import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    take: 5,
    select: { id: true, name: true, student_code: true, class_id: true }
  });
  console.log('Sample Students:', JSON.stringify(students, null, 2));

  const classes = await (prisma as any).class.findMany({
    select: { name: true }
  });
  console.log('Existing Classes:', JSON.stringify(classes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
