import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const productName = 'Desktop File Integrity';
const outDir = 'release';

let bin;

switch (process.platform) {
  case 'win32':
    bin = join(outDir, 'win-unpacked', `${productName}.exe`);
    break;

  case 'darwin': {
    // electron-builder uses mac-arm64 on Apple Silicon, mac on Intel
    const arm = join(outDir, 'mac-arm64', `${productName}.app`, 'Contents', 'MacOS', productName);
    const intel = join(outDir, 'mac', `${productName}.app`, 'Contents', 'MacOS', productName);
    bin = existsSync(arm) ? arm : intel;
    break;
  }

  case 'linux':
    bin = join(outDir, 'linux-unpacked', 'desktop-file-integrity');
    break;

  default:
    console.error(`Unsupported platform: ${process.platform}`);
    process.exit(1);
}

if (!existsSync(bin)) {
  console.error(`Could not find built binary at: ${bin}`);
  process.exit(1);
}

console.log(`Launching: ${bin}`);
execFileSync(bin, { stdio: 'inherit' });
