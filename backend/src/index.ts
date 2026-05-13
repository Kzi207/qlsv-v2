import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`[VERIFY-001] Server is running on port ${PORT}`);
});
