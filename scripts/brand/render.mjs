// Renders the brand images into public/ with headless Chrome, so they use the real fonts:
//   og/pt-BR.png, og/en.png      OpenGraph cards, 1200 x 630
//   .github/assets/banner.png   README banner and GitHub social preview, 1280 x 640
//   apple-touch-icon.png         180, full bleed (iOS rounds it)
//   icon-192.png, icon-512.png   rounded tiles for the web manifest
//   icon-maskable-512.png        full bleed with the mark inside the safe zone
//   favicon.ico                  16 + 32, PNG inside an ICO container
// Usage: node scripts/brand/render.mjs   (CHROME=/path/to/chrome to override)
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../../public');
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const work = join(tmpdir(), `algo-brand-${process.pid}`);
mkdirSync(join(pub, 'og'), { recursive: true });
mkdirSync(work, { recursive: true });

function shoot(page, query, [w, h], out) {
	const url = `${pathToFileURL(join(here, page)).href}?${new URLSearchParams(query)}`;
	execFileSync(chrome, [
		'--headless=new',
		'--disable-gpu',
		'--hide-scrollbars',
		'--force-device-scale-factor=1',
		'--default-background-color=00000000',
		'--allow-file-access-from-files',
		'--virtual-time-budget=6000',
		`--window-size=${w},${h}`,
		`--screenshot=${out}`,
		url,
	], { stdio: 'ignore' });
	console.log('wrote', out.replace(pub, 'public'));
}

shoot('og.html', { lang: 'pt-BR' }, [1200, 630], join(pub, 'og/pt-BR.png'));
shoot('og.html', { lang: 'en' }, [1200, 630], join(pub, 'og/en.png'));
mkdirSync(resolve(here, '../../.github/assets'), { recursive: true });
shoot('og.html', { lang: 'en' }, [1280, 640], resolve(here, '../../.github/assets/banner.png'));
shoot('icon.html', { size: 180, pad: 0.16, round: 0 }, [180, 180], join(pub, 'apple-touch-icon.png'));
shoot('icon.html', { size: 192, pad: 0.14 }, [192, 192], join(pub, 'icon-192.png'));
shoot('icon.html', { size: 512, pad: 0.14 }, [512, 512], join(pub, 'icon-512.png'));
shoot('icon.html', { size: 512, pad: 0.24, round: 0 }, [512, 512], join(pub, 'icon-maskable-512.png'));

// favicon.ico: an ICO directory pointing at two embedded PNGs
const sizes = [16, 32];
const pngs = sizes.map((size) => {
	const out = join(work, `fav-${size}.png`);
	shoot('icon.html', { size, pad: 0.08 }, [size, size], out);
	return readFileSync(out);
});
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
	const e = 6 + i * 16;
	header.writeUInt8(sizes[i], e);
	header.writeUInt8(sizes[i], e + 1);
	header.writeUInt16LE(1, e + 4);
	header.writeUInt16LE(32, e + 6);
	header.writeUInt32LE(png.length, e + 8);
	header.writeUInt32LE(offset, e + 12);
	offset += png.length;
});
writeFileSync(join(pub, 'favicon.ico'), Buffer.concat([header, ...pngs]));
console.log('wrote public/favicon.ico');
rmSync(work, { recursive: true, force: true });
