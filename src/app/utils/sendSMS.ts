import axios from "axios";
import { globalSettingModel } from "../modules/globalSetting/globalSetting.model";

export const sendSMS = async (number: string, message: string) => {
  const globalSettings = await globalSettingModel.findOne();
  if (!globalSettings) {
    throw new Error("Global settings not found");
  }

  const smsUrl = globalSettings.smsUrl;
  const smsToken = globalSettings.smsToken;

  if (!smsUrl || !smsToken) {
    throw new Error("SMS API credentials not configured");
  }

  const formData = new URLSearchParams();

  formData.append("token", smsToken);
  formData.append("message", message);
  formData.append("to", number);

  try {
    await axios.post(smsUrl, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    throw new Error("Error sending SMS");
  }
};
