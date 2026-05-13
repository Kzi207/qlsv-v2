import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '../generated/client_final';

const prismaClient = new PrismaClient();

const prisma = new Proxy(prismaClient, {
  get(target: any, prop: string | symbol) {
    if (typeof prop === 'string') {
      // 1. Check if the property exists as-is (e.g., lowercase models)
      if (prop in target) return target[prop];

      // 2. Map 'class' to 'renamedclass'
      if (prop === 'class') return target.renamedclass;

      // 3. Try lowercase (e.g., trainingScore -> trainingscore)
      const lower = prop.toLowerCase();
      if (lower in target) return target[lower];
    }
    return target[prop];
  }
});

export default prisma as any;
