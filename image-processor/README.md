# Image Processor

A TypeScript utility that processes images in a directory and generates multiple sizes of images.

## Features

- Process entire directories recursively
- Maintain folder structure in output
- Supports common image formats (jpg, jpeg, png, webp)
- Configurable image sizes
- Configurable image format
- Configurable image quality
- Configurable image maintain aspect ratio
- Configurable concurrent image processing

## Prerequisites

- Node.js (v12 or higher)
- TypeScript

## Installation

```bash
npm install
```

## Usage
1. Install required dependencies:

```bash
npm install
```


2. Clone or copy the `image-processor.ts` and `index.ts` files to your project.

## Usage

### Basic Usage

```bash
npx tsx index.ts
```


## Error Handling

The converter includes error handling for:
- Invalid input directories
- Image processing errors
- File system operations
- Individual file processing failures (continues processing other files)

Failed conversions are logged to the console but don't stop the overall process.

## Technical Details

The converter uses:
- Node.js file system operations (promisified)
- TypeScript for type safety
- Child process spawning for FFmpeg operations

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
