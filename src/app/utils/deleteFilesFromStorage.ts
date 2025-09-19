import fs from "fs/promises";

export const deleteFileFromStorage = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error deleting image: ${filePath}`, error);
  }
};
