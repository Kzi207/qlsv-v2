import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- TABLES ---');
    const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(tables);

    console.log('--- COLUMNS FOR User ---');
    const columns = await prisma.$queryRawUnsafe("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'User'");
    console.log(columns);

    console.log('--- ENUM VALUES ---');
    const enums = await prisma.$queryRawUnsafe("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'Role'");
    console.log(enums);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
