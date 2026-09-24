// Run with a password supplied on stdin. Never pass it as a command-line argument.
// The plaintext game lives in .private/, which must remain excluded from Git.
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { createInterface } from 'node:readline';

const input = createInterface({ input: process.stdin, terminal: false });
process.stderr.write('Code de chiffrement attendu sur stdin (non enregistré).\n');
input.once('line', async password => {
  input.close();
  try {
    if (password.length < 10) throw new Error('Utiliser un code d’au moins 10 caractères.');
    const plaintext = await readFile(new URL('../.private/game.html', import.meta.url));
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const iterations = 600000;
    const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
    key.fill(0);
    plaintext.fill(0);
    await writeFile(new URL('../assets/mission-reseau.enc.json', import.meta.url), JSON.stringify({
      version: 1, algorithm: 'AES-GCM', kdf: 'PBKDF2', hash: 'SHA-256', iterations,
      salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64')
    }));
    console.log('Jeu chiffré : assets/mission-reseau.enc.json');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
});
