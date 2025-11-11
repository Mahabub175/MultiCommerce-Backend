import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "equlibrium1705@gmail.com",
    pass: "dpqz ongs hltn hhll",
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailOptions) => {
  try {
    await transporter.sendMail({
      from: "equlibrium1705@gmail.com",
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    throw new Error("Email sending failed");
  }
};
