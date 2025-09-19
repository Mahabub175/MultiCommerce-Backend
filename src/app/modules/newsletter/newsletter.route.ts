import express from "express";
import { newsletterControllers } from "./newsletter.controller";

const router = express.Router();

router.post("/newsletter/", newsletterControllers.createNewsletterController);

router.get("/newsletter/", newsletterControllers.getAllNewsletterController);

router.get(
  "/newsletter/:newsletterId/",
  newsletterControllers.getSingleNewsletterController
);

router.patch(
  "/newsletter/:newsletterId/",
  newsletterControllers.updateSingleNewsletterController
);

router.delete(
  "/newsletter/:newsletterId/",
  newsletterControllers.deleteSingleNewsletterController
);

router.post(
  "/newsletter/bulk-delete/",
  newsletterControllers.deleteManyNewsletterController
);

export const newsletterRoutes = router;
