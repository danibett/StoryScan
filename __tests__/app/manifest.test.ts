import fs from 'fs';
import path from 'path';
import manifest from '@/app/manifest';

const root = path.resolve(__dirname, '../..');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('app icon and manifest', () => {
  it('is an installable standalone app', () => {
    const m = manifest();
    expect(m.start_url).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.icons?.map((i) => i.purpose)).toContain('maskable');
  });

  it('points to real PNG icons in public/', () => {
    for (const icon of manifest().icons ?? []) {
      const file = path.join(root, 'public', icon.src);
      expect(fs.existsSync(file)).toBe(true);
      expect(fs.readFileSync(file).subarray(0, 8).equals(PNG)).toBe(true);
    }
  });

  it('ships the favicon files Next.js turns into <link> tags', () => {
    expect(fs.readFileSync(path.join(root, 'app/icon.svg'), 'utf8')).toContain('<svg');
    expect(fs.readFileSync(path.join(root, 'app/apple-icon.png')).subarray(0, 8).equals(PNG)).toBe(true);
    expect(fs.existsSync(path.join(root, 'app/favicon.ico'))).toBe(true);
  });
});
