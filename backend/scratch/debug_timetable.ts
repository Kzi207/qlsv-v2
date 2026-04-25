import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const username = 'SV001'; // Assuming a student username, I'll try to find any student
    const users = await prisma.$queryRawUnsafe('SELECT id, username, name, role, class_id FROM "User" WHERE role::text = \'STUDENT\' LIMIT 5');
    console.log('--- SAMPLE STUDENTS ---');
    console.log(users);

    const timetables = await prisma.$queryRawUnsafe('SELECT id, subject, "classId", "semesterId" FROM "Timetable" LIMIT 5');
    console.log('--- SAMPLE TIMETABLES ---');
    console.log(timetables);

    const classes = await prisma.$queryRawUnsafe('SELECT name FROM "Class"');
    console.log('--- ALL CLASSES ---');
    console.log(classes);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
