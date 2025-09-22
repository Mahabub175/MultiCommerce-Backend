import multer, { StorageEngine } from "multer";
import path from "path";

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "");
    const timestamp = Date.now();
    cb(null, `${baseName}_${timestamp}${ext}`);
  },
});

const uploadService = multer({
  storage,
});

export { uploadService };
