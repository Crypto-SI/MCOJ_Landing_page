const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateFavicons() {
  const inputFile = path.join(process.cwd(), 'brand', 'OJ logo.jpeg');
  const outputDir = path.join(process.cwd(), 'public', 'favicon');

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Generate different sizes
    const sizes = {
      'favicon-16x16.png': 16,
      'favicon-32x32.png': 32,
      'apple-touch-icon.png': 180,
      'android-chrome-192x192.png': 192,
      'android-chrome-512x512.png': 512
    };

    for (const [filename, size] of Object.entries(sizes)) {
      const outputPath = path.join(outputDir, filename);
      await sharp(inputFile)
        .resize(size, size)
        .toFormat('png')
        .toFile(outputPath);
      console.log(`Generated ${filename}`);
    }

    // Create favicon.ico from the 32x32 PNG
    const favicon32Path = path.join(outputDir, 'favicon-32x32.png');
    const faviconPath = path.join(outputDir, 'favicon.ico');
    await fs.copyFile(favicon32Path, faviconPath);
    console.log('Generated favicon.ico');

    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 