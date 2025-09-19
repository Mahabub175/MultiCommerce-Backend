import express, { Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { uploadService } from "./upload";
import config from "../../config";
import slugify from "slugify";

const router = express.Router();

const rootDir = path.resolve(".");
const uploadDir = path.join(rootDir, "uploads");

const downloadImage = async (imageUrl: string): Promise<string> => {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data, "binary");

  const originalName = imageUrl.split("/").pop() || "image.jpg";
  const safeName = `${Date.now()}-${slugify(originalName, { lower: true })}`;
  const imagePath = path.join(uploadDir, safeName);

  fs.writeFileSync(imagePath, buffer);

  return imagePath;
};

router.post(
  "/upload/",
  uploadService.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (req.body.image) {
        const imageUrl = req.body.image;
        const imagePath = await downloadImage(imageUrl);

        const fileUrl = `uploads/${path.basename(imagePath)}`;

        return res.status(200).json({
          success: true,
          message: "Image uploaded successfully",
          file: {
            url: fileUrl,
            path: imagePath,
          },
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const filePath = req.file.path.replace(/\\/g, "/");
      const fileUrl = `${config.base_url}/${filePath}`;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        file: {
          ...req.file,
          url: fileUrl,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error.message,
      });
    }
  }
);

export const uploadRoutes = router;
