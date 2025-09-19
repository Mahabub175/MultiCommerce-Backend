import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { TUserRole } from "./../modules/user/user.interface";
import config from "../config";
import { userModel } from "../modules/user/user.model";
import httpStatus from "http-status";

const auth = (...requiredRoles: TUserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          status: httpStatus.UNAUTHORIZED,
          message: "No token provided",
        });
      }

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      const decode = jwt.verify(
        token,
        config.jwt_access_secret as string
      ) as JwtPayload;

      const { userId, role } = decode;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          status: httpStatus.UNAUTHORIZED,
          message: "User not found",
        });
      }

      if (requiredRoles.length && !requiredRoles.includes(role)) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          status: httpStatus.FORBIDDEN,
          message: "Unauthorized Access",
        });
      }

      req.user = decode as JwtPayload;

      next();
    } catch (error) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        status: httpStatus.UNAUTHORIZED,
        message: "Invalid token",
      });
    }
  };
};

export default auth;
