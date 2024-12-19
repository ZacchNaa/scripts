# Video to Audio Converter

A TypeScript utility that converts video files to audio formats using FFmpeg. This tool can process multiple video files in a directory, including subdirectories, and maintains the original folder structure in the output.

## Features

- Convert multiple video formats to audio (mp3, wav, aac, flac)
- Process entire directories recursively
- Maintain folder structure in output
- Configurable audio bitrate
- Option to remove original video files
- Supports common video formats (mp4, avi, mov, mkv, webm, flv, wmv, m4v, mpg, mpeg)

## Prerequisites

- Node.js (v12 or higher)
- FFmpeg installed on your system
- TypeScript

### Installing FFmpeg

**MacOS:** 

```bash
brew install ffmpeg
```

**Windows:** 
Download from [FFmpeg website](https://ffmpeg.org/download.html) or use Chocolatey:

```bash
choco install ffmpeg
```


## Installation

1. Install required dependencies:

```bash
npm install
```


2. Clone or copy the `video-to-audio-converter.ts` file to your project.

## Usage

### Basic Usage

```bash
npx tsx video-to-audio-converter.ts
```


## Error Handling

The converter includes error handling for:
- Invalid input directories
- FFmpeg conversion errors
- File system operations
- Individual file conversion failures (continues processing other files)

Failed conversions are logged to the console but don't stop the overall process.

## Technical Details

The converter uses:
- FFmpeg for audio extraction and conversion
- Node.js file system operations (promisified)
- TypeScript for type safety
- Child process spawning for FFmpeg operations

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
