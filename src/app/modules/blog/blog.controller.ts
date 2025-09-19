import { NextFunction, Request, Response } from "express";
import { blogServices } from "./blog.service";

const createBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    const filePath = req.file ? req.file.path : undefined;

    const formData = {
      ...data,
      attachment: filePath,
    };

    const result = await blogServices.createBlogService(formData);

    res.status(200).json({
      success: true,
      message: "Blog Created Successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSize = limit ? parseInt(limit as string, 10) : undefined;

    const searchText = req.query.searchText as string | undefined;

    const searchFields = ["name"];

    const result = await blogServices.getAllBlogService(
      pageNumber,
      pageSize,
      searchText,
      searchFields
    );

    res.status(200).json({
      success: true,
      message: "Blogs Fetched Successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//Get single Blog data
const getSingleBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { blogId } = req.params;
    const result = await blogServices.getSingleBlogService(blogId);
    res.status(200).json({
      success: true,
      message: "Blog Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getSingleBlogBySlugController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { blogSlug } = req.params;
    const result = await blogServices.getSingleBlogBySlugService(blogSlug);
    res.status(200).json({
      success: true,
      message: "Blog Fetched Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Update single Blog controller
const updateSingleBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { blogId } = req.params;
    const data = req.body;
    const filePath = req.file ? req.file.path : undefined;

    const blogData = {
      ...data,
      attachment: filePath,
    };

    const result = await blogServices.updateSingleBlogService(blogId, blogData);

    res.status(200).json({
      success: true,
      message: "Blog Updated Successfully!",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete single Blog controller
const deleteSingleBlogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { blogId } = req.params;
    await blogServices.deleteSingleBlogService(blogId);
    res.status(200).json({
      success: true,
      message: "Blog Deleted Successfully!",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

//Delete many Blog controller
const deleteManyBlogsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const blogIds = req.body;

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty Blog IDs array provided",
        data: null,
      });
    }

    const result = await blogServices.deleteManyBlogsService(blogIds);

    res.status(200).json({
      success: true,
      message: `Bulk Blog Delete Successful! Deleted ${result.deletedCount} Blogs.`,
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const blogControllers = {
  createBlogController,
  getAllBlogController,
  getSingleBlogController,
  getSingleBlogBySlugController,
  updateSingleBlogController,
  deleteSingleBlogController,
  deleteManyBlogsController,
};
