const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Set the input and output directories
const inputDir = './inputs';
const outputDir = './outputs';

// Set the input and output file formats
const inputFormat = '.png';
const outputFormat = '.webp';

// Set the compression options
const compressionOptions = {
  quality: 100, // Adjust quality level (0-100)
  effort: 6, // Adjust effort level (0-6)
  alphaQuality: 100, // Adjust alpha quality level (0-100)
};

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Get a list of all files in the input directory
fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error('Error reading input directory:', err);
    return;
  }

  // Loop through each file in the input directory
  // Filter files with correct input format first
  const validFiles = files.filter(file => path.extname(file).toLowerCase() === inputFormat);

  // Process files concurrently with Promise.all for better performance
  Promise.all(
    validFiles.map(async (file) => {
      try {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, path.basename(file, inputFormat) + outputFormat);

        // Get image metadata first to optimize processing
        const metadata = await sharp(inputPath).metadata();
        
        // Only resize if image is larger than target height
        const pipeline = sharp(inputPath, {
          failOnError: false, // Continue processing if minor errors occur
          sequentialRead: true // Better performance for large files
        });

        if (metadata.height > 1080) {
          pipeline.resize(null, 1080, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: 'lanczos3' // Higher quality downscaling
          });
        }

        await pipeline
          .webp({
            ...compressionOptions,
            lossless: true, // Better quality
            nearLossless: true, // Better quality with minimal size impact
            smartSubsample: true // Better chroma subsampling
          })
          .toFile(outputPath);

        console.log(`Converted ${file} to ${path.basename(outputPath)}`);
      } catch (err) {
        console.error(`Error converting file ${file}:`, err);
      }
    })
  ).then(() => {
    console.log('All conversions completed');
  }).catch(err => {
    console.error('Error in batch processing:', err);
  });
});