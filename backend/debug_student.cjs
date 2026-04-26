const { PrismaClient } = require('./src/generated/client');
const p = new PrismaClient();
p.student.findMany({ where: { name: { contains: 'DUY' } } })
  .then(s => console.log(JSON.stringify(s, null, 2)))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
