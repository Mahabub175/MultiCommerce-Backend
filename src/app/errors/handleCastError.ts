import mongoose from "mongoose";

export const handleCastError = (error: mongoose.Error.CastError) => {
  const message = `invalid ${error.path}`;
  const errorMessage = `${error.value} is not valid in ${error.path}`;

  return {
    message,
    errorMessage,
  };
};
