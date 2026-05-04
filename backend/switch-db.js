import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const provider = process.argv[2];

if (!['mysql', 'postgresql'].includes(provider)) {
  console.error('Usage: node switch-db.js [mysql|postgresql]');
  process.exit(1);
}

try {
  let content = fs.readFileSync(schemaPath, 'utf8');
  
  // Replace provider
  const newContent = content.replace(
    /provider\s*=\s*"(mysql|postgresql)"/,
    `provider = "${provider}"`
  );

  fs.writeFileSync(schemaPath, newContent);
  console.log(`Successfully switched Prisma provider to: ${provider}`);
  console.log('Next steps:');
  console.log('1. Update DATABASE_URL in your .env file');
  console.log('2. Run: npx prisma generate');
  console.log('3. Run: npx prisma db push');
} catch (error) {
  console.error('Error switching provider:', error.message);
  process.exit(1);
}
