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
export const deleteFileSync = (filePath: string): void => {
  if (!filePath) return;

  try {
    const fileName = path.basename(filePath);

    const fullPath = path.resolve(process.cwd(), "uploads", fileName);

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ File not found: ${fileName}`);
      return;
    }

    const stats = fs.statSync(fullPath);

    if (!stats.isFile()) {
      return;
    }

    fs.unlinkSync(fullPath);
  } catch (error) {}
};
