import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

// Delete file asynchronously using fs/promises
export const deleteFileFromStorage = async (filePath: string) => {
  if (!filePath) return;

  const fileName = path.basename(filePath);
  const fullPath = path.join(process.cwd(), "uploads", fileName);

  try {
    await fsPromises.unlink(fullPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(`File not found: ${fileName}`);
    } else {
      console.error(`Error deleting file: ${fileName}`, error);
    }
  }
};

// Delete file synchronously using fs
export const deleteFileSync = (filePath: string) => {
  if (!filePath) return;

  const fileName = path.basename(filePath);
  const fullPath = path.join(process.cwd(), "uploads", fileName);

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.warn(`Failed to delete file: ${fileName}`);
    }
  } else {
    console.warn(`File not found: ${fileName}`);
  }
};
