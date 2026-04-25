import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing curriculum data...');
  // Delete in order to handle relations
  const facultyCodes = ['CK', 'DDT'];
  const faculties = await prisma.faculty.findMany({ where: { code: { in: facultyCodes } } });
  const facultyIds = faculties.map(f => f.id);
  
  const existingMajors = await prisma.major.findMany({ where: { facultyId: { in: facultyIds } } });
  const majorIds = existingMajors.map(m => m.id);

  // Clear everything related to these majors
  await prisma.curriculumSubject.deleteMany({ where: { majorId: { in: majorIds } } });
  await prisma.curriculumSemester.deleteMany({ where: { majorId: { in: majorIds } } });
  await prisma.major.deleteMany({ where: { id: { in: majorIds } } });
  await prisma.faculty.deleteMany({ where: { id: { in: facultyIds } } });

  console.log('Seeding curriculum data...');

  // 1. Create Faculties
  const ck = await prisma.faculty.upsert({
    where: { code: 'CK' },
    update: {},
    create: {
      code: 'CK',
      name: 'Khoa Kỹ thuật Cơ khí',
      description: 'Đào tạo kỹ sư cơ khí, cơ điện tử và tự động hóa.'
    }
  });

  const ddt = await prisma.faculty.upsert({
    where: { code: 'DDT' },
    update: {},
    create: {
      code: 'DDT',
      name: 'Khoa Điện - Điện tử, Viễn thông',
      description: 'Đào tạo kỹ sư điện, điện tử và viễn thông.'
    }
  });

  // 2. Create Majors
  const majors = [
    { facultyId: ck.id, code: 'CDT', name: 'Ngành Cơ điện tử' },
    { facultyId: ck.id, code: 'TDH', name: 'Ngành Tự động hóa' },
    { facultyId: ddt.id, code: 'KTNL', name: 'Ngành Kỹ thuật năng lượng' },
    { facultyId: ddt.id, code: 'DDT_MAJ', name: 'Ngành Điện - Điện tử' }
  ];

  const creditDistribution = [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 10, 9];

  for (const m of majors) {
    const major = await prisma.major.upsert({
      where: { code: m.code },
      update: {},
      create: {
        facultyId: m.facultyId,
        code: m.code,
        name: m.name,
        totalCredits: 161,
        totalSemesters: 13
      }
    });

    // Create 13 semesters for each major
    for (let i = 1; i <= 13; i++) {
      const semester = await prisma.curriculumSemester.create({
        data: {
          majorId: major.id,
          semesterNumber: i,
          name: `Học kỳ ${i}`,
          expectedCredits: creditDistribution[i - 1]
        }
      });

      // Add dummy subjects to reach the expected credits
      let currentCredits = 0;
      let subjectIndex = 1;
      const targetCredits = creditDistribution[i - 1];

      while (currentCredits < targetCredits) {
        let subCredits = 2;
        if (targetCredits - currentCredits === 3) subCredits = 3;
        if (targetCredits - currentCredits === 1) {
            // Adjust last subject to be +1 credit
            // But we don't have existing subjects yet, let's just create unique ones
            subCredits = 1; 
        }
        
        // Final semester check for Thesis
        if (i === 13 && currentCredits === 0) subCredits = 9; // Thesis is 9 credits

        const subCode = `${m.code}_S${i}_${subjectIndex}`;
        const subName = i === 13 ? `Đồ án tốt nghiệp ${m.name}` : `Môn học ${subjectIndex} - HK${i} - ${m.name}`;
        
        const subject = await prisma.subject.upsert({
          where: { code: subCode },
          update: {},
          create: {
            code: subCode,
            name: subName,
            credits: subCredits,
            theoryPeriods: subCredits * 15,
            practicePeriods: subCredits > 2 ? 15 : 0,
            subjectType: i >= 12 ? 'THESIS' : (subCredits > 2 ? 'PRACTICE' : 'LECTURE')
          }
        });

        await prisma.curriculumSubject.create({
          data: {
            majorId: major.id,
            semesterId: semester.id,
            subjectId: subject.id,
            isRequired: true,
            displayOrder: subjectIndex
          }
        });

        currentCredits += subCredits;
        subjectIndex++;
      }
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
