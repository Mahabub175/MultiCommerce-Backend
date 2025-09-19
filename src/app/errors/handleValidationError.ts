import mongoose from "mongoose";

export const handleValidationError = (
  error: mongoose.Error.ValidationError
) => {
  const errorKey = Object.keys(error.errors)[0];
  const message = `invalid ${error.errors[errorKey].path}`;
  const errorMessage = `${error.errors[errorKey].value} is not valid ${error.errors[errorKey].path}`;
  const errorDetails = error.errors[errorKey];

  return {
    message,
    errorMessage,
    errorDetails,
  };
};
