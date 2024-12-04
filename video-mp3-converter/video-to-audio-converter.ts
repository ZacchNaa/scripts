import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { spawn } from 'child_process';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

interface ConversionOptions {
  inputDirectory: string;
  outputDirectory?: string;
  format?: 'mp3' | 'wav' | 'aac' | 'flac';
  bitrate?: string;
  removeOriginal?: boolean;
  recursive?: boolean;
}

class DirectoryVideoConverter {
  // Video file extensions to convert
  private static VIDEO_EXTENSIONS = [
    '.mp4', '.avi', '.mov', '.mkv', '.webm', 
    '.flv', '.wmv', '.m4v', '.mpg', '.mpeg'
  ];

  /**
   * Convert all videos in a directory
   * @param options Conversion configuration
   * @returns Promise with list of converted file paths
   */
  static async convertDirectory(options: ConversionOptions): Promise<string[]> {
    // Merge default options
    const config: ConversionOptions = {
      format: 'mp3',
      bitrate: '192k',
      removeOriginal: false,
      recursive: true,
      ...options
    };

    // Validate input directory
    await this.validateDirectory(config.inputDirectory);

    // Create output directory if not specified
    const outputDir = config.outputDirectory || 
      path.join(config.inputDirectory, 'converted_audio');
    await this.ensureDirectoryExists(outputDir);

    // Find video files
    const videoFiles = await this.findVideoFiles(
      config.inputDirectory, 
      config.recursive
    );

    // Convert files
    const convertedFiles: string[] = [];
    for (const videoFile of videoFiles) {
      try {
        // Calculate relative path for maintaining directory structure
        const relativePathFromInput = path.relative(
          config.inputDirectory, 
          videoFile
        );
        const outputPath = path.join(
          outputDir, 
          `${path.parse(relativePathFromInput).name}.${config.format}`
        );

        // Ensure output directory exists
        await this.ensureDirectoryExists(path.dirname(outputPath));

        // Convert individual file
        const result = await this.convertSingleFile({
          inputPath: videoFile,
          outputPath,
          format: config.format!,
          bitrate: config.bitrate!,
          removeOriginal: config.removeOriginal ?? false
        });

        convertedFiles.push(result);
      } catch (error) {
        console.error(`Failed to convert ${videoFile}: ${error}`);
      }
    }

    return convertedFiles;
  }

  /**
   * Find all video files in a directory
   */
  private static async findVideoFiles(
    directory: string, 
    recursive: boolean = true
  ): Promise<string[]> {
    const videoFiles: string[] = [];

    async function traverseDirectory(dir: string) {
      const files = await readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const fileStat = await stat(fullPath);

        if (fileStat.isDirectory() && recursive) {
          await traverseDirectory(fullPath);
        } else if (fileStat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (DirectoryVideoConverter.VIDEO_EXTENSIONS.includes(ext)) {
            videoFiles.push(fullPath);
          }
        }
      }
    }

    await traverseDirectory(directory);
    return videoFiles;
  }

  /**
   * Convert a single video file
   */
  private static async convertSingleFile(options: {
    inputPath: string;
    outputPath: string;
    format: string;
    bitrate: string;
    removeOriginal: boolean;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn('ffmpeg', [
        '-i', options.inputPath,
        '-vn',                   // Ignore video
        '-acodec', 'libmp3lame', // Use efficient MP3 encoder
        '-b:a', options.bitrate, // Set audio bitrate
        '-map', '0:a:0',         // Select first audio stream
        options.outputPath
      ]);

      ffmpegProcess.on('close', async (code) => {
        if (code === 0) {
          // Optional: Remove original file
          if (options.removeOriginal) {
            try {
              await promisify(fs.unlink)(options.inputPath);
            } catch (error) {
              console.warn(`Could not remove original file: ${error}`);
            }
          }
          resolve(options.outputPath);
        } else {
          reject(new Error(`Conversion failed with code ${code}`));
        }
      });

      ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
      });

      ffmpegProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Validate input directory
   */
  private static async validateDirectory(directory: string): Promise<void> {
    try {
      const dirStat = await stat(directory);
      if (!dirStat.isDirectory()) {
        throw new Error('Not a directory');
      }
    } catch (error) {
      throw new Error(`Invalid input directory: ${error.message}`);
    }
  }

  /**
   * Ensure directory exists, create if not
   */
  private static async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      await mkdir(directory, { recursive: true });
    } catch (error) {
      // Ignore error if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

// Example usage
async function main() {
  try {
    // Convert all videos in a directory
    const convertedFiles = await DirectoryVideoConverter.convertDirectory({
      inputDirectory: './videos',           // Source directory
      outputDirectory: './converted_audio', // Optional: custom output directory
      format: 'mp3',                        // Output format
      bitrate: '192k',                      // Audio quality
      recursive: true,                      // Search subdirectories
      removeOriginal: false                 // Keep original video files
    });

    console.log('Converted files:', convertedFiles);
  } catch (error) {
    console.error('Conversion error:', error);
  }
}

// Uncomment to run
main();

export default DirectoryVideoConverter;