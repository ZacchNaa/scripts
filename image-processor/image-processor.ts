import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { optimize, Config } from 'svgo';

interface Size {
  width: number;
  height?: number;
  suffix: string;
}

interface ProcessOptions {
  inputDir: string;
  outputDir: string;
  sizes: Size[];
  quality?: number;
  format?: 'jpeg' | 'jpg' | 'webp' | 'png' | 'avif' | 'svg';
  maintainAspectRatio?: boolean;
  concurrent?: number;
  svgBackground?: string;
}

class ImageProcessor {
  private options: ProcessOptions;
  private svgoConfig: Config = {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            removeUnknownsAndDefaults: {
              keepRoleAttr: true,
              keepAriaAttrs: true
            },
          },
        },
      },
      {
        name: 'removeDimensions',
      },
      {
        name: 'sortAttrs',
        params: {
          xmlnsOrder: 'alphabetical',
        },
      },
      {
        name: 'removeAttrs',
        params: {
          attrs: '(class|style)'
        }
      },
      {
        name: 'cleanupIds',
        params: {
          minify: true
        }
      }
    ],
  };

  constructor(options: ProcessOptions) {
    this.options = {
      quality: 80,
      format: 'webp',
      maintainAspectRatio: true,
      concurrent: 3,
      svgBackground: '#ffffff',
      ...options
    };
  }

  async process(): Promise<void> {
    try {
      await fs.mkdir(this.options.outputDir, { recursive: true });

      const files = await fs.readdir(this.options.inputDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file)
      );

      const chunks = this.chunkArray(imageFiles, this.options.concurrent!);

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(file => this.processImage(file))
        );
      }

      console.log('All images processed successfully!');
    } catch (error) {
      console.error('Error processing images:', error);
      throw error;
    }
  }

  private async processImage(filename: string): Promise<void> {
    const inputPath = path.join(this.options.inputDir, filename);
    const { name, ext } = path.parse(filename);
    const isSvg = ext.toLowerCase() === '.svg';

    try {
      if (isSvg && this.options.format === 'svg') {
        await this.processSvgToSvg(inputPath, name);
      } else if (isSvg) {
        await this.processSvgToRaster(inputPath, name);
      } else if (this.options.format === 'svg') {
        console.warn(`Skipping ${filename}: Cannot convert raster images to SVG`);
      } else {
        await this.processRasterImage(inputPath, name);
      }
    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
    }
  }

  private async processSvgToSvg(inputPath: string, name: string): Promise<void> {
    try {
      const svgContent = await fs.readFile(inputPath, 'utf8');
      
      const result = optimize(svgContent, {
        ...this.svgoConfig,
        path: inputPath,
      });

      await Promise.all(
        this.options.sizes.map(async size => {
          const outputFilename = `${name}-${size.suffix}.svg`;
          const outputPath = path.join(this.options.outputDir, outputFilename);

          let scaledSvg = result.data;
          if (size.width) {
            const viewBoxMatch = scaledSvg.match(/viewBox="([^"]+)"/);
            if (viewBoxMatch) {
              const [x, y, width, height] = viewBoxMatch[1].split(' ').map(Number);
              const scale = size.width / width;
              const newHeight = size.height || (height * scale);
              
              scaledSvg = scaledSvg
                .replace(/width="[^"]*"/, `width="${size.width}"`)
                .replace(/height="[^"]*"/, `height="${newHeight}"`);
            }
          }

          await fs.writeFile(outputPath, scaledSvg);
          console.log(`Processed: ${outputFilename}`);
        })
      );
    } catch (error) {
      throw new Error(`SVG optimization failed: ${error.message}`);
    }
  }

  private async processSvgToRaster(inputPath: string, name: string): Promise<void> {
    try {
      let image = sharp(inputPath, {
        density: 300,
        failOnError: false,
        sequentialRead: true
      });

      if (this.options.svgBackground) {
        image = image.flatten({ background: this.options.svgBackground });
      }

      await Promise.all(
        this.options.sizes.map(async size => {
          const resizeOptions = {
            width: size.width,
            height: size.height,
            fit: this.options.maintainAspectRatio ? 'inside' as const : 'fill' as const,
            withoutEnlargement: true,
            kernel: 'lanczos3' as const
          };

          const outputFilename = `${name}-${size.suffix}.${this.options.format}`;
          const outputPath = path.join(this.options.outputDir, outputFilename);

          const pipeline = image.clone().resize(resizeOptions);

          switch (this.options.format) {
            case 'webp':
              await pipeline
                .webp({
                  quality: 90,
                  effort: 6,
                  nearLossless: true,
                  smartSubsample: true
                })
                .toFile(outputPath);
              break;
            
            case 'png':
              await pipeline
                .png({
                  quality: 100,
                  effort: 10,
                  palette: false,
                  dither: 0
                })
                .toFile(outputPath);
              break;
            
            case 'jpeg':
            case 'jpg':
              await pipeline
                .jpeg({
                  quality: 90,
                  mozjpeg: true
                })
                .toFile(outputPath);
              break;

            case 'avif':
              await pipeline
                .avif({
                  quality: 90,
                  effort: 8
                })
                .toFile(outputPath);
              break;
          }

          console.log(`Processed: ${outputFilename}`);
        })
      );
    } catch (error) {
      throw new Error(`SVG to raster conversion failed: ${error.message}`);
    }
  }

  private async processRasterImage(inputPath: string, name: string): Promise<void> {
    try {
      const imageBuffer = await fs.readFile(inputPath);
      const image = sharp(imageBuffer, {
        failOnError: false,
        sequentialRead: true
      });

      const metadata = await image.metadata();

      await Promise.all(
        this.options.sizes.map(async size => {
          const resizeOptions = {
            width: size.width,
            height: size.height,
            fit: this.options.maintainAspectRatio ? 'inside' as const : 'fill' as const,
            withoutEnlargement: true,
            kernel: 'lanczos3' as const
          };

          const outputFilename = `${name}-${size.suffix}.${this.options.format}`;
          const outputPath = path.join(this.options.outputDir, outputFilename);

          const pipeline = image.clone().resize(resizeOptions);

          switch (this.options.format) {
            case 'webp':
              await pipeline
                .webp({
                  quality: this.options.quality,
                  effort: 6,
                  nearLossless: true,
                  smartSubsample: true
                })
                .toFile(outputPath);
              break;
            
            case 'png':
              await pipeline
                .png({
                  quality: this.options.quality,
                  effort: 10,
                  palette: true
                })
                .toFile(outputPath);
              break;
            
            case 'jpeg':
            case 'jpg':
              await pipeline
                .jpeg({
                  quality: this.options.quality,
                  mozjpeg: true
                })
                .toFile(outputPath);
              break;

            case 'avif':
              await pipeline
                .avif({
                  quality: this.options.quality,
                  effort: 6
                })
                .toFile(outputPath);
              break;
          }

          console.log(`Processed: ${outputFilename}`);
        })
      );
    } catch (error) {
      throw new Error(`Raster image processing failed: ${error.message}`);
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

export { ImageProcessor, ProcessOptions, Size }; 