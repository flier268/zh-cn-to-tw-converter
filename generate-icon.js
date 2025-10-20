const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Generate application icon with Chinese character conversion theme
 * Creates a 512x512 PNG icon showing simplified → traditional Chinese conversion
 */
function generateIcon() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - gradient from blue to purple
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4A90E2');
  gradient.addColorStop(1, '#7B68EE');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add subtle Minecraft-style cube pattern in background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  const cubeSize = 80;

  // Draw isometric cube outlines
  for (let x = -cubeSize; x < size; x += cubeSize) {
    for (let y = -cubeSize; y < size; y += cubeSize) {
      drawIsometricCube(ctx, x + cubeSize/2, y + cubeSize/2, cubeSize * 0.6);
    }
  }

  // Draw main content area - white rounded rectangle
  const contentMargin = 60;
  const contentSize = size - (contentMargin * 2);
  const cornerRadius = 40;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  roundRect(ctx, contentMargin, contentMargin, contentSize, contentSize, cornerRadius);
  ctx.fill();

  // Draw border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 3;
  roundRect(ctx, contentMargin, contentMargin, contentSize, contentSize, cornerRadius);
  ctx.stroke();

  // Draw simplified Chinese character "简" (simplified)
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 140px "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('简', size / 2 - 80, size / 2 - 60);

  // Draw arrow
  ctx.fillStyle = '#4A90E2';
  drawArrow(ctx, size / 2 - 10, size / 2 - 60, 80, 12);

  // Draw traditional Chinese character "繁" (traditional)
  ctx.fillStyle = '#7B68EE';
  ctx.font = 'bold 140px "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('繁', size / 2 + 80, size / 2 - 60);

  // Draw subtitle text
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.fillText('ZH-CN → ZH-TW', size / 2, size / 2 + 100);

  // Draw Minecraft-style text
  ctx.fillStyle = '#999999';
  ctx.font = '28px Arial, sans-serif';
  ctx.fillText('Resource Pack Converter', size / 2, size / 2 + 145);

  return canvas;
}

/**
 * Draw a rounded rectangle path
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw an arrow
 */
function drawArrow(ctx, x, y, length, width) {
  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  // Arrow shaft
  ctx.moveTo(0, -width/2);
  ctx.lineTo(length - 20, -width/2);
  ctx.lineTo(length - 20, -width * 1.5);
  // Arrow head
  ctx.lineTo(length, 0);
  ctx.lineTo(length - 20, width * 1.5);
  ctx.lineTo(length - 20, width/2);
  ctx.lineTo(0, width/2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw isometric cube outline (Minecraft style)
 */
function drawIsometricCube(ctx, x, y, size) {
  const h = size * 0.866; // height for isometric projection

  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  // Top face
  ctx.moveTo(0, -h/2);
  ctx.lineTo(size/2, -h/4);
  ctx.lineTo(0, 0);
  ctx.lineTo(-size/2, -h/4);
  ctx.closePath();

  // Left face
  ctx.moveTo(-size/2, -h/4);
  ctx.lineTo(-size/2, h/4);
  ctx.lineTo(0, h/2);
  ctx.lineTo(0, 0);

  // Right face
  ctx.moveTo(size/2, -h/4);
  ctx.lineTo(size/2, h/4);
  ctx.lineTo(0, h/2);
  ctx.lineTo(0, 0);

  ctx.stroke();
  ctx.restore();
}

/**
 * Convert PNG to ICO format (multiple sizes)
 */
async function generateICO(pngBuffer) {
  // For ICO generation, we'll need to create multiple sizes
  // ICO files typically contain 16x16, 32x32, 48x48, and 256x256
  const sizes = [16, 32, 48, 256];
  const images = [];

  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create a scaled-down version
    const sourceCanvas = createCanvas(512, 512);
    const sourceCtx = sourceCanvas.getContext('2d');

    // Redraw at original size
    const originalCanvas = generateIcon();
    sourceCtx.drawImage(originalCanvas, 0, 0);

    // Scale down with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, 512, 512, 0, 0, size, size);

    images.push({
      size: size,
      buffer: canvas.toBuffer('image/png')
    });
  }

  return createICOBuffer(images);
}

/**
 * Create ICO file buffer from multiple PNG images
 */
function createICOBuffer(images) {
  // ICO header (6 bytes)
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalDirSize = headerSize + (dirEntrySize * images.length);

  let totalSize = totalDirSize;
  images.forEach(img => {
    totalSize += img.buffer.length;
  });

  const buffer = Buffer.alloc(totalSize);
  let offset = 0;

  // Write ICO header
  buffer.writeUInt16LE(0, offset); offset += 2; // Reserved (must be 0)
  buffer.writeUInt16LE(1, offset); offset += 2; // Type (1 = ICO)
  buffer.writeUInt16LE(images.length, offset); offset += 2; // Number of images

  // Write directory entries
  let imageDataOffset = totalDirSize;
  images.forEach(img => {
    buffer.writeUInt8(img.size === 256 ? 0 : img.size, offset); offset += 1; // Width (0 = 256)
    buffer.writeUInt8(img.size === 256 ? 0 : img.size, offset); offset += 1; // Height (0 = 256)
    buffer.writeUInt8(0, offset); offset += 1; // Color palette (0 = no palette)
    buffer.writeUInt8(0, offset); offset += 1; // Reserved
    buffer.writeUInt16LE(1, offset); offset += 2; // Color planes
    buffer.writeUInt16LE(32, offset); offset += 2; // Bits per pixel
    buffer.writeUInt32LE(img.buffer.length, offset); offset += 4; // Image data size
    buffer.writeUInt32LE(imageDataOffset, offset); offset += 4; // Image data offset

    imageDataOffset += img.buffer.length;
  });

  // Write image data
  images.forEach(img => {
    img.buffer.copy(buffer, offset);
    offset += img.buffer.length;
  });

  return buffer;
}

// Main execution
async function main() {
  console.log('🎨 Generating application icons...\n');

  // Ensure assets directory exists
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Generate main icon (512x512 PNG)
  console.log('📐 Creating 512x512 PNG icon...');
  const iconCanvas = generateIcon();
  const pngPath = path.join(assetsDir, 'icon.png');
  const pngBuffer = iconCanvas.toBuffer('image/png');
  fs.writeFileSync(pngPath, pngBuffer);
  console.log('✅ Saved:', pngPath);

  // Generate Windows ICO
  console.log('\n🪟 Creating Windows ICO icon (16, 32, 48, 256)...');
  const icoBuffer = await generateICO(pngBuffer);
  const icoPath = path.join(assetsDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('✅ Saved:', icoPath);

  console.log('\n🎉 Icon generation complete!');
  console.log('\nGenerated files:');
  console.log('  - assets/icon.png (512x512 for Linux)');
  console.log('  - assets/icon.ico (multi-size for Windows)');
}

// Check if canvas is installed
try {
  require.resolve('canvas');
  main().catch(error => {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  });
} catch (e) {
  console.error('❌ Error: "canvas" package not found.');
  console.error('\nPlease install it first:');
  console.error('  npm install canvas --save-dev');
  console.error('\nNote: On Linux, you may need to install system dependencies:');
  console.error('  Ubuntu/Debian: sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev');
  console.error('  Fedora: sudo dnf install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel');
  process.exit(1);
}
