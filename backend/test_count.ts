import prisma from './src/utils/prisma';
async function test() {
  const major = await prisma.major.findUnique({
    where: { code: 'CDT' },
    include: {
      _count: {
        select: { curriculumSemesters: true, curriculumSubjects: true }
      }
    }
  });
  console.log(major);
  process.exit(0);
}
test();
