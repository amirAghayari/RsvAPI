import fs from "node:fs";
import path from "node:path";
import { AppError } from "../utils/AppError";

//  we can upload file with cloudinary , aws s3

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const NATIONAL_CARD_DIR = path.join(UPLOAD_ROOT, "national-cards");

[UPLOAD_ROOT, NATIONAL_CARD_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
export class UploadService {
  async uploadOne(
    file: Express.Multer.File,
    userId: string,
    _eventId: string
  ): Promise<string> {
    if (!file.path) {
      throw new AppError("FILE_UPLOAD_FAILED", 500);
    }

    const ext = path.extname(file.originalname);
    const uniqueName = `${userId}_${Date.now()}${ext}`;
    const destPath = path.join(NATIONAL_CARD_DIR, uniqueName);

    try {
      await fs.promises.rename(file.path, destPath);
      return uniqueName;
    } catch (err) {
      throw new AppError("FILE_MOVE_FAILED", 500);
    }
  }

  async uploadMany(
    files: Express.Multer.File[],
    userId: string,
    eventId: string
  ): Promise<string[]> {
    const uploaded: string[] = [];

    try {
      const results = await Promise.all(
        files.map((file) => this.uploadOne(file, userId, eventId))
      );
      uploaded.push(...results);
      return uploaded;
    } catch (err) {
      await this.removeMany(uploaded);
      throw err;
    }
  }

  async removeOne(fileName: string) {
    const filePath = path.join(NATIONAL_CARD_DIR, fileName);
    try {
      await fs.promises.unlink(filePath);
    } catch {}
  }

  async removeMany(fileNames: string[]) {
    await Promise.all(fileNames.map((f) => this.removeOne(f)));
  }
}

export default UploadService;
