import { Request, Response, NextFunction } from "express";
import { userModel } from "../modules/user/user.model";

export const checkAccess = (path: string, permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id || req.params.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User ID missing",
        });
      }

      const user = await userModel
        .findById(userId)
        .select("access role roleModel")
        .populate({
          path: "role",
          select: "access",
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userAccess = user.access || [];

      const roleAccess = (user.role && (user.role as any).access) || [];

      const mergedAccess = [...roleAccess, ...userAccess];

      const pathAccess = mergedAccess.find((a: any) => a.path === path);

      if (!pathAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Path not allowed",
        });
      }

      const hasPermission = pathAccess.permissions.includes(permission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Missing '${permission}' permission`,
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Server error",
      });
    }
  };
};
