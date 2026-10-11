import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcPath = 'C:/Users/Flavius/.gemini/antigravity/brain/d65b281c-25c2-44c7-8acc-3073eb6732f0/media__1791746493912.jpg';
const destDir = 'C:/Users/Flavius/.gemini/antigravity/scratch/coffee-app/public/assets';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// 1. Copy original / high-res jpg
const destJpg = path.join(destDir, 'pumpkin_spice_latte.jpg');
fs.copyFileSync(srcPath, destJpg);

// 2. Generate optimized square WebP (640x640) matching the other drink cards
const destWebp = path.join(destDir, 'pumpkin_spice_latte.webp');
await sharp(srcPath)
    .resize(640, 640, {
        fit: 'cover',
        position: 'center'
    })
    .webp({ quality: 85, effort: 6 })
    .toFile(destWebp);

// 3. Generate a base64 Data URL for Supabase DB storage (matching admin upload format)
const base64Buf = await sharp(srcPath)
    .resize(640, 640, {
        fit: 'cover',
        position: 'center'
    })
    .jpeg({ quality: 80 })
    .toBuffer();

const dataUrl = `data:image/jpeg;base64,${base64Buf.toString('base64')}`;
fs.writeFileSync('C:/Users/Flavius/.gemini/antigravity/scratch/coffee-app/public/assets/pumpkin_spice_latte_dataurl.txt', dataUrl);

console.log('Successfully processed Pumpkin Spice Latte images:');
console.log('- JPG saved to:', destJpg);
console.log('- WebP saved to:', destWebp);
console.log('- Data URL length:', dataUrl.length);
