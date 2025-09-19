import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { handleZodError } from "../errors/handleZodError";
import { handleDuplicateError } from "../errors/handleDuplicateError";
import { handleValidationError } from "../errors/handleValidationError";
import { handleCastError } from "../errors/handleCastError";

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errorMessage = error?.message;
  let errorDetails = error;

  if (error instanceof ZodError) {
    message = "Validation Error";
    errorMessage = handleZodError(error);
  } else if (error?.code === 11000) {
    message = "Duplicate Error";
    errorMessage = handleDuplicateError(error);
  } else if (error?.name === "ValidationError") {
    const validationData = handleValidationError(error);
    message = validationData?.message;
    errorMessage = validationData?.errorMessage;
    errorDetails = validationData?.errorDetails;
  } else if (error?.name === "CastError") {
    const castErrorData = handleCastError(error);
    message = castErrorData?.message;
    errorMessage = castErrorData?.errorMessage;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorMessage,
    errorDetails,
    stack: error?.stack,
  });
};
