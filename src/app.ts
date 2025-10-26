import express, { Application, Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import router from "./app/routes";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
import httpStatus from "http-status";

const app: Application = express();

const allowedOrigins: string[] = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://cellfashion.vercel.app",
];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

const uploadsPath = path.resolve("uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// API routes
app.use("/uploads", express.static(uploadsPath));

app.use("/api/v1", router);

app.get("/api/v1", (req: Request, res: Response) => {
  res.send({
    success: true,
    status: httpStatus.OK,
    message: "This is the starting of all the routes in this server!",
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send({
    success: true,
    status: httpStatus.OK,
    message: "Welcome To Your Secured Server!",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
