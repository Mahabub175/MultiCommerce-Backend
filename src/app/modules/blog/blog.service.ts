import mongoose from "mongoose";
import { paginateAndSort } from "../../utils/paginateAndSort";
import { formatResultImage } from "../../utils/formatResultImage";
import { IBlog } from "./blog.interface";
import { blogModel } from "./blog.model";
import { generateSlug } from "../../utils/generateSlug";
import path from "path";
import fs from "fs";

//Create a blog into database
const createBlogService = async (blogData: IBlog, filePath?: string) => {
  const slug = generateSlug(blogData.name);
  const dataToSave = { ...blogData, slug, filePath };
  const result = await blogModel.create(dataToSave);
  return result;
};

// Get all blogs with optional pagination
const getAllBlogService = async (
  page?: number,
  limit?: number,
  searchText?: string,
  searchFields?: string[]
) => {
  let results;

  if (page && limit) {
    const query = blogModel.find();
    const result = await paginateAndSort(
      query,
      page,
      limit,
      searchText,
      searchFields
    );

    result.results = formatResultImage<IBlog>(
      result.results,
      "attachment"
    ) as IBlog[];

    return result;
  } else {
    results = await blogModel.find().sort({ createdAt: -1 }).exec();

    results = formatResultImage(results, "attachment");

    return {
      results,
    };
  }
};

// Get single blog
const getSingleBlogService = async (blogId: number | string) => {
  const queryId =
    typeof blogId === "string" ? new mongoose.Types.ObjectId(blogId) : blogId;

  const result = await blogModel.findById(queryId).exec();
  if (!result) {
    throw new Error("Blog not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<IBlog>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

const getSingleBlogBySlugService = async (blogSlug: string) => {
  const result = await blogModel.findOne({ slug: blogSlug }).exec();

  if (!result) {
    throw new Error("Blog not found");
  }

  if (typeof result.attachment === "string") {
    const formattedAttachment = formatResultImage<IBlog>(result.attachment);
    if (typeof formattedAttachment === "string") {
      result.attachment = formattedAttachment;
    }
  }

  return result;
};

//Update single blog
const updateSingleBlogService = async (
  blogId: string | number,
  blogData: IBlog
) => {
  const queryId =
    typeof blogId === "string" ? new mongoose.Types.ObjectId(blogId) : blogId;

  const blog = await blogModel.findById(queryId).exec();

  if (!blog) {
    throw new Error("Blog not found");
  }

  if (blogData.attachment && blog.attachment !== blogData.attachment) {
    const prevFileName = path.basename(blog.attachment);
    const prevFilePath = path.join(process.cwd(), "uploads", prevFileName);

    if (fs.existsSync(prevFilePath)) {
      try {
        fs.unlinkSync(prevFilePath);
      } catch (err) {
        console.warn(
          `Failed to delete previous attachment for blog ${blog._id}`
        );
      }
    } else {
      console.warn(`Previous attachment not found for blog ${blog._id}`);
    }
  }

  const result = await blogModel
    .findByIdAndUpdate(
      queryId,
      { $set: blogData },
      { new: true, runValidators: true }
    )
    .exec();

  if (!result) {
    throw new Error("Blog update failed");
  }

  return result;
};

//Delete single blog
const deleteSingleBlogService = async (blogId: string | number) => {
  const queryId =
    typeof blogId === "string" ? new mongoose.Types.ObjectId(blogId) : blogId;

  const blog = await blogModel.findById(queryId).exec();

  if (!blog) {
    throw new Error("Blog not found");
  }

  if (blog.attachment) {
    const fileName = path.basename(blog.attachment);
    const attachmentPath = path.join(process.cwd(), "uploads", fileName);

    if (fs.existsSync(attachmentPath)) {
      try {
        fs.unlinkSync(attachmentPath);
      } catch (err) {
        throw new Error("Failed to delete attachment file");
      }
    } else {
      throw new Error("Attachment file not found on server");
    }
  }

  const result = await blogModel.findByIdAndDelete(queryId).exec();

  if (!result) {
    throw new Error("Blog delete failed");
  }

  return result;
};

//Delete many blog
const deleteManyBlogsService = async (blogIds: (string | number)[]) => {
  const queryIds = blogIds.map((id) => {
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    } else if (typeof id === "number") {
      return id;
    } else {
      throw new Error(`Invalid ID format: ${id}`);
    }
  });

  const blogs = await blogModel.find({ _id: { $in: queryIds } });

  for (const blog of blogs) {
    if (blog.attachment) {
      const fileName = path.basename(blog.attachment);
      const filePath = path.join(process.cwd(), "uploads", fileName);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn(`Failed to delete attachment for blog ${blog._id}`);
        }
      } else {
        console.warn(`Attachment not found for blog ${blog._id}`);
      }
    }
  }

  const result = await blogModel.deleteMany({ _id: { $in: queryIds } }).exec();

  return result;
};

export const blogServices = {
  createBlogService,
  getAllBlogService,
  getSingleBlogService,
  getSingleBlogBySlugService,
  updateSingleBlogService,
  deleteSingleBlogService,
  deleteManyBlogsService,
};
