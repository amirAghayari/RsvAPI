import streamifier from "streamifier";

import cloudinary from "../../../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { BadRequestError } from "../../../errors/bad-request-error";

export class CloudinaryService {
  async upload(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "users",
        },
        (error, result) => {
          if (error) return reject(error);

          if (!result) {
            return reject(new BadRequestError("Upload failed"));
          }

          return resolve(result);
        },
      );

      streamifier.createReadStream(buffer).pipe(stream);
    });
  }
}
