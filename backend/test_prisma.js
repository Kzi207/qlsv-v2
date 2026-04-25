import prisma from './src/utils/prisma.js';

async function test() {
  try {
    const course = await prisma.course.findUnique({
      where: { id: 1 },
      include: { 
        subject: true,
        lessons: true,
        assignments: true,
        exams: true
      }
    });
    console.log('Course found:', course);
  } catch (err) {
    console.error('Prisma error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
