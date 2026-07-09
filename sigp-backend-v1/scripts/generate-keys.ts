import { generateKeyPairSync } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const keysDir = join(process.cwd(), 'keys');

if (!existsSync(keysDir)) {
  mkdirSync(keysDir, { recursive: true });
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const publicPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;

writeFileSync(join(keysDir, 'private.pem'), privatePem);
writeFileSync(join(keysDir, 'public.pem'), publicPem);

console.log('RSA keys generated:');
console.log('  keys/private.pem');
console.log('  keys/public.pem');
console.log('IMPORTANT: Add keys/ to .gitignore (already done)');
