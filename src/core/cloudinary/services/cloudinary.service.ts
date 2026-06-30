import streamifier from "streamifier";

import cloudinary from "../../reservations/controllers/cloudinary";

export class CloudinaryService {
  upload(buffer: Buffer) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "users",
        },
        (error, result) => {
          if (error) return reject(error);

          resolve(result);
        },
      );

      streamifier.createReadStream(buffer).pipe(stream);
    });
  }
}
