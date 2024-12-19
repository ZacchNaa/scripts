import { ImageProcessor } from './image-processor';
import path from 'path';

// async function main() {
//   const processor = new ImageProcessor({
//     inputDir: './input',
//     outputDir: './output',
//     sizes: [
//       // { width: 512, height: 512, suffix: '512x512' },
//       // { width: 192, height: 192, suffix: '192x192' },
//       { width: 180, height: 180, suffix: '180x180' },
//       { width: 180, height: 180, suffix: '180x180' },
//     ],
//     format: 'png',
//     quality: 80,
//     maintainAspectRatio: true,
//     concurrent: 3
//   });

//   await processor.process();
// }

// main().catch(console.error); 

// if you need to process both SVG and PNG files with different output formats, 
// you can run the processor twice:

// 1. Process SVG files
// 2. Process PNG files

async function main() {
  // Process raster images to PNG/WebP
  const rasterProcessor = new ImageProcessor({
    inputDir: './input',
    outputDir: './output',
    sizes: [
      { width: 1920, suffix: 'large' },
      { width: 1280, suffix: 'medium' },
      { width: 768, suffix: 'small' },
      { width: 300, height: 300, suffix: 'thumbnail' }
    ],
    format: 'png',  // or 'webp' for better compression
    quality: 80,
    maintainAspectRatio: true,
    concurrent: 3
  });

  // Process SVG files
  const svgProcessor = new ImageProcessor({
    inputDir: './input',
    outputDir: path.join('./output', 'svg'),
    sizes: [
      { width: 1920, suffix: 'large' },
      { width: 1280, suffix: 'medium' },
      { width: 768, suffix: 'small' }
    ],
    format: 'svg',
    maintainAspectRatio: true,
    concurrent: 3
  });

  await Promise.all([
    rasterProcessor.process(),
    svgProcessor.process()
  ]);
}

main().catch(console.error);