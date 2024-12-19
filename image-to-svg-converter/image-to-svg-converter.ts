import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ConversionOptions {
  inputDir: string;
  outputDir: string;
  threshold?: number; // 0-255, default 128
  colors?: number;    // number of colors to use
  concurrent?: number;
  removeTemp?: boolean;
}

class RasterToSvgConverter {
  private options: Required<ConversionOptions>;

  constructor(options: ConversionOptions) {
    this.options = {
      threshold: 128,
      colors: 2,
      concurrent: 3,
      removeTemp: true,
      ...options
    };
  }

  async convert(): Promise<void> {
    try {
      // Create output directory
      await fs.mkdir(this.options.outputDir, { recursive: true });

      // Get all image files
      const files = await fs.readdir(this.options.inputDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png)$/i.test(file)
      );

      // Process in chunks for concurrency control
      const chunks = this.chunkArray(imageFiles, this.options.concurrent);

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(file => this.convertSingle(file))
        );
      }

      console.log('All images processed successfully!');
    } catch (error) {
      console.error('Error processing images:', error);
      throw error;
    }
  }

  private async convertSingle(filename: string): Promise<void> {
    const inputPath = path.join(this.options.inputDir, filename);
    const { name } = path.parse(filename);
    const tempPpmFile = path.join(this.options.outputDir, `${name}.ppm`);
    const outputPath = path.join(this.options.outputDir, `${name}.svg`);

    try {
      // 1. Convert to PPM format using sharp
      await sharp(inputPath)
        .grayscale() // Convert to grayscale
        .threshold(this.options.threshold) // Apply threshold
        .toFile(tempPpmFile);

      // 2. Use potrace to convert PPM to SVG
      await execAsync(`potrace "${tempPpmFile}" -s -o "${outputPath}"`);

      // 3. Clean up temporary file if needed
      if (this.options.removeTemp) {
        await fs.unlink(tempPpmFile);
      }

      console.log(`Processed: ${filename} -> ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`Error converting ${filename}:`, error);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Example usage
async function main() {
  const converter = new RasterToSvgConverter({
    inputDir: './input',
    outputDir: './output-svg',
    threshold: 128,
    colors: 2,
    concurrent: 3
  });

  await converter.convert();
}

main().catch(console.error);

export { RasterToSvgConverter, ConversionOptions }; 