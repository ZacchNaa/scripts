# Image to SVG Converter

A TypeScript utility that converts image files to SVG format.

## Features

- Convert multiple image formats to SVG
- Process entire directories recursively
- Maintain folder structure in output
- Configurable threshold, colors, and concurrent processing
- Option to remove original image files
- Supports common image formats (png, jpg, jpeg, avif, webp)

## Prerequisites

- Node.js (v12 or higher)
- TypeScript

### Installing Sharp

**MacOS:** 

```bash
brew install sharp
```
 # On Mac
   brew install potrace

   # On Ubuntu/Debian
   sudo apt-get install potrace

   # On Windows
   # Download from http://potrace.sourceforge.net/#downloading


## Installation

1. Install required dependencies:

```bash
npm install
```


2. Clone or copy the `image-to-svg-converter.ts` file to your project.

## Usage

### Basic Usage

```bash
npx tsx image-to-svg-converter.ts
```


## Error Handling

The converter includes error handling for:
- Invalid input directories
- Potrace conversion errors
- File system operations
- Individual file conversion failures (continues processing other files)

Failed conversions are logged to the console but don't stop the overall process.

## Technical Details

The converter uses:
- Potrace for image to SVG conversion
- Node.js file system operations (promisified)
- TypeScript for type safety
- Child process spawning for Potrace operations

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

#  Important notes:

- The quality of the SVG output heavily depends on the input image
- The conversion process is lossy and works best with high-contrast images
- The resulting SVGs will be black and white unless you modify the potrace parameters
- For complex images, the resulting SVG files might be larger than the original raster images
- Would you like me to add any specific features or modify the implementation in any way?


# Important limitations:

SVG is a vector format, while PNG/JPG are raster formats
Direct conversion will typically result in either:
- A very large SVG file that essentially embeds the raster image
- Or a traced vector version that may look significantly different from the original

However, I can help you create a script that uses potrace (a tool for tracing bitmap images and transforming them into vector graphics) to create SVG conversions. The results will be best with:
- High contrast images
- Logos or simple graphics
- Black and white or limited color images