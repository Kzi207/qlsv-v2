import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-secret-key-32-chars-!!'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16
const ENCRYPTED_VALUE_PATTERN = /^[0-9a-f]{32}:[0-9a-f]+$/i;

export function encrypt(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

export function decrypt(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const text = typeof value === 'string' ? value : String(value);
  if (!text || !ENCRYPTED_VALUE_PATTERN.test(text)) return text;

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return text;
  }
}
