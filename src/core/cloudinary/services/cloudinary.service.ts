import streamifier from "streamifier";

import cloudinary from "../../../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { BadRequestError } from "../../../errors/bad-request-error";
import { logger } from "../../../logger/logger";

export class CloudinaryService {
  async upload(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "users",
        },
        (error, result) => {
          if (error) {
            logger.error(
              {
                err: error,
              },
              "Cloudinary upload failed",
            );

            return reject(error);
          }

          if (!result) {
            logger.warn({}, "Cloudinary upload completed without response");

            return reject(new BadRequestError("Upload failed"));
          }

          logger.info(
            {
              publicId: result.public_id,
              resourceType: result.resource_type,
              format: result.format,
              size: result.bytes,
            },
            "Cloudinary upload successful",
          );

          return resolve(result);
        },
      );

      streamifier.createReadStream(buffer).pipe(stream);
    });
  }
}
