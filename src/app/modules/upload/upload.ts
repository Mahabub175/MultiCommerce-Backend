import multer, { StorageEngine } from "multer";

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadService = multer({
  storage,
});

export { uploadService };
