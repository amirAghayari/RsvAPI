import fs from "node:fs/promises";
import path from "node:path";
import { AppError } from "../utils/AppError";

//  we can upload file with cloudinary , aws s3

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const NATIONAL_CARD_DIR = path.join(UPLOAD_ROOT, "national-cards");

export class UploadService {
  async uploadOne(
    file: Express.Multer.File,
    _userId: string,
    _eventId: string
  ): Promise<string> {
    if (!file.path) {
      throw new AppError("FILE_UPLOAD_FAILED", 500);
    }

    return path.basename(file.path);
  }

  async uploadMany(
    files: Express.Multer.File[],
    userId: string,
    eventId: string
  ): Promise<string[]> {
    const uploaded: string[] = [];

    try {
      for (const file of files) {
        const name = await this.uploadOne(file, userId, eventId);
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
    } catch {}
  }

  async removeMany(fileNames: string[]) {
    await Promise.all(fileNames.map((f) => this.removeOne(f)));
  }
}

export default UploadService;
