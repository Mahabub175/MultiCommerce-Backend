import mongoose from "mongoose";
import config from "./app/config";
import app from "./app";
import { log } from "console-log-colors";

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    app.listen(config.port, () => {
      log("Database is connected successfully!", "green");
      log(`Server is running on http://localhost:${config.port}`, "green");
      log(
        `Routes are running on http://localhost:${config.port}/api/v1`,
        "green"
      );
    });
  } catch (error) {
    console.log(error);
  }
}

main();
