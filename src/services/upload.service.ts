import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "../utils/AppError";

//  we can upload file with cloudinary , aws s3

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const NATIONAL_CARD_DIR = path.join(UPLOAD_ROOT, "national-cards");

export class UploadService {
  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(NATIONAL_CARD_DIR, { recursive: true });
    } catch (err) {
      console.error("UPLOAD_DIR_INIT_FAILED", err);
      throw new AppError("UPLOAD_INIT_FAILED", 500);
    }
  }

  async uploadOne(
    buffer: Buffer,
    originalName: string,
    userId: string,
    eventId: string
  ): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();

    if (!ext) {
      throw new AppError("INVALID_FILE_EXTENSION", 400);
    }

    const fileName = `${userId}_${eventId}_${randomUUID()}${ext}`;
    const filePath = path.join(NATIONAL_CARD_DIR, fileName);

    try {
      await fs.writeFile(filePath, buffer);
      return fileName; // store only filename, not absolute path
    } catch (err) {
      console.error("FILE_UPLOAD_FAILED", err);
      throw new AppError("FILE_UPLOAD_FAILED", 500);
    }
  }

  async uploadMany(
    files: Express.Multer.File[],
    userId: string,
    eventId: string
  ): Promise<string[]> {
    const uploaded: string[] = [];

    try {
      for (const file of files) {
        const name = await this.uploadOne(
          file.buffer,
          file.originalname,
          userId,
          eventId
        );
        uploaded.push(name);
      }

      return uploaded;
    } catch (err) {
      await this.removeMany(uploaded);
      throw err;
    }
  }

  async removeOne(fileName: string) {
    const filePath = path.join(NATIONAL_CARD_DIR, fileName);

    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.error("FILE_DELETE_FAILED", err);
      }
    }
  }

  async removeMany(fileNames: string[]) {
    await Promise.all(fileNames.map((f) => this.removeOne(f)));
  }

  resolvePath(fileName: string): string {
    return path.join(NATIONAL_CARD_DIR, fileName);
  }
}

export default UploadService;
