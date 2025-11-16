import { model, Schema } from "mongoose";
import { IGlobalSetting } from "./globalSetting.interface";

const globalSettingSchema = new Schema<IGlobalSetting>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "MultiCommerce",
    },
    description: {
      type: String,
      trim: true,
      default: "MultiCommerce Description",
    },
    businessNumber: {
      type: String,
      trim: true,
      default: "MultiCommerce Number",
    },
    businessAddress: {
      type: String,
      trim: true,
      default: "MultiCommerce Address",
    },
    businessLocation: {
      type: String,
      trim: true,
      default: "MultiCommerce Location",
    },
    businessSlogan: {
      type: String,
      trim: true,
      default: "MultiCommerce Slogan",
    },
    businessEmail: {
      type: String,
      trim: true,
      default: "MultiCommerce Email",
    },
    businessFacebook: {
      type: String,
      trim: true,
      default: "MultiCommerce Facebook",
    },
    businessInstagram: {
      type: String,
      trim: true,
      default: "MultiCommerce Instagram",
    },
    businessTwitter: {
      type: String,
      trim: true,
      default: "MultiCommerce Twitter",
    },
    businessLinkedin: {
      type: String,
      trim: true,
      default: "MultiCommerce Linkedin",
    },
    businessYoutube: {
      type: String,
      trim: true,
      default: "MultiCommerce Linkedin",
    },
    businessWhatsapp: {
      type: String,
      trim: true,
      default: "MultiCommerce Whatsapp",
    },
    businessWorkHours: {
      type: String,
      trim: true,
      default: "MultiCommerce Work Hours",
    },
    smsUrl: { type: String, default: null, trim: true },
    smsToken: { type: String, default: null, trim: true },
    primaryColor: { type: String, default: "" },
    secondaryColor: { type: String, default: "" },
    logo: { type: String, default: null, trim: true },
    favicon: { type: String, default: null, trim: true },
    aboutBanner: { type: String, default: null, trim: true },
    serviceBanner: { type: String, default: null, trim: true },
    workBanner: { type: String, default: null, trim: true },
    processBanner: { type: String, default: null, trim: true },
    galleryBanner: { type: String, default: null, trim: true },
    shopBanner: { type: String, default: null, trim: true },
    contactBanner: { type: String, default: null, trim: true },
    blogBanner: { type: String, default: null, trim: true },
    currency: { type: String, default: "৳" },
    delivery: { type: String, default: "" },
    pickupPoint: { type: String, default: "" },
    paymentTerms: { type: String, default: "" },
    privacyPolicy: { type: String, default: "" },
    refundAndReturns: { type: String, default: "" },
    termsAndConditions: { type: String, default: "" },
    shippingPolicy: { type: String },
    cookiePolicy: { type: String },
    disclaimer: { type: String },
    accessibilityStatement: { type: String },
    paymentPolicy: { type: String },
    cancellationPolicy: { type: String },
    warrantyPolicy: { type: String },
    subscriptionPolicy: { type: String },
    affiliateDisclosure: { type: String },
    ssl: { type: Boolean, default: false },
    useSms: { type: Boolean, default: false },
    useEmail: { type: Boolean, default: false },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const globalSettingModel = model<IGlobalSetting>(
  "globalSetting",
  globalSettingSchema
);
