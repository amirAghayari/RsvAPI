import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image")) {
      return cb(new Error("Only images are allowed"));
    }

    cb(null, true);
  },
});
