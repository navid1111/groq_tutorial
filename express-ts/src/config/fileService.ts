// services/FileService.ts
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

class FileService {
  private static UPLOADS_DIR = path.join(process.cwd(), 'uploads');

  static async initialize() {
    await fsPromises.mkdir(this.UPLOADS_DIR, { recursive: true });
  }

  static async saveTempFile(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.UPLOADS_DIR, filename);
    await fsPromises.writeFile(filePath, file.buffer);
    return filePath;
  }

  static async readAsBase64(
    filePath: string,
    mimetype: string,
  ): Promise<string> {
    const buffer = await fsPromises.readFile(filePath);
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
  }

  static async cleanup(filePath: string) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
        console.log('Cleaned up temporary file:', filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  static validateFileType(file: Express.Multer.File, allowedTypes: string[]) {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  static createReadStream(filePath: string): fs.ReadStream {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.createReadStream(filePath);
  }
}

export default FileService;
