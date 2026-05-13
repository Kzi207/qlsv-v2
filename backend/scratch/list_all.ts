import { PrismaClient } from '../src/generated/client_final/index.js';

const prisma = new PrismaClient();

async function listAll() {
  try {
    const cs = await (prisma as any).classsubject.findMany();
    console.log(JSON.stringify(cs, null, 2));
    
    const students = await (prisma as any).student.findMany({ take: 5 });
    console.log('Students:', JSON.stringify(students.map((s: any) => ({ id: s.id, code: s.student_code, classId: s.class_id })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

listAll();
